import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2024-11-20.acacia'
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    const body = await req.text();
    
    // אימות חתימת Webhook
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Webhook event type:', event.type);

    // טיפול באירועים שונים
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        
        // מצא את המשתמש לפי customer_id
        const users = await base44.asServiceRole.entities.User.filter({
          stripe_customer_id: customerId
        });

        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active'
          });

          console.log('User subscription activated:', users[0].email);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        const users = await base44.asServiceRole.entities.User.filter({
          stripe_customer_id: customerId
        });

        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status
          });

          console.log('Subscription updated:', subscription.status);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        const users = await base44.asServiceRole.entities.User.filter({
          stripe_customer_id: customerId
        });

        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            stripe_subscription_id: null,
            subscription_status: 'cancelled'
          });

          console.log('Subscription cancelled:', users[0].email);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('Payment succeeded:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed:', invoice.id);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});