import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Brain, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageContext';


export default function PageNotFound({}) {
    const location = useLocation();
    const navigate = useNavigate();
    const { language } = useLanguage();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100" dir={language === 'he' ? 'rtl' : 'ltr'}>
            <div className="max-w-md w-full">
                <div className="text-center space-y-6 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {/* Logo */}
                    <div className="flex justify-center mb-2">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
                            <Brain className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    
                    {/* 404 Error Code */}
                    <div className="space-y-2">
                        <h1 className="text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">404</h1>
                        <div className="h-1 w-20 bg-gradient-to-r from-gray-900 to-gray-600 mx-auto rounded-full"></div>
                    </div>
                    
                    {/* Main Message */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {language === 'he' ? 'הדף לא נמצא' : 'Page Not Found'}
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            {language === 'he' ? (
                                <>הדף <span className="font-semibold text-gray-900">"{pageName}"</span> לא קיים במערכת</>
                            ) : (
                                <>The page <span className="font-semibold text-gray-900">"{pageName}"</span> could not be found</>
                            )}
                        </p>
                    </div>
                    
                    {/* Admin Note */}
                    {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                        <div className="mt-6 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">!</span>
                                </div>
                                <div className="text-right flex-1">
                                    <p className="text-sm font-semibold text-gray-900 mb-1">
                                        {language === 'he' ? 'הערה למנהל' : 'Admin Note'}
                                    </p>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {language === 'he' 
                                            ? 'ייתכן שהדף טרם נוצר. פנה לעוזר האישי בצ\'אט ובקש ליצור אותו.'
                                            : 'This page may not be created yet. Ask the assistant in chat to create it.'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="pt-4 space-y-3">
                        <Button
                            onClick={() => navigate('/')}
                            className="w-full bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg"
                        >
                            <Home className="w-4 h-4 ml-2" />
                            {language === 'he' ? 'חזור לדף הבית' : 'Go to Dashboard'}
                        </Button>
                        
                        <Button
                            onClick={() => navigate(-1)}
                            variant="outline"
                            className="w-full border-gray-300 hover:bg-gray-50"
                        >
                            {language === 'he' ? 'חזור לדף הקודם' : 'Go Back'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}