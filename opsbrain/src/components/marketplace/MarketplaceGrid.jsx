import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, MapPin, Briefcase, CheckCircle, MessageSquare, Search } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import ProfessionalDetailDialog from './ProfessionalDetailDialog';

export default function MarketplaceGrid({ professionals = [] }) {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProfessional, setSelectedProfessional] = useState(null);

  const categories = [
    { value: 'all', label: language === 'he' ? 'הכל' : 'All' },
    { value: 'legal', label: language === 'he' ? 'משפטי' : 'Legal' },
    { value: 'accounting', label: language === 'he' ? 'הנהלת חשבונות' : 'Accounting' },
    { value: 'tax', label: language === 'he' ? 'מיסים' : 'Tax' },
    { value: 'marketing', label: language === 'he' ? 'שיווק' : 'Marketing' },
    { value: 'consulting', label: language === 'he' ? 'ייעוץ' : 'Consulting' },
    { value: 'it', label: language === 'he' ? 'IT' : 'IT' },
    { value: 'design', label: language === 'he' ? 'עיצוב' : 'Design' },
  ];

  const filteredProfessionals = professionals.filter(prof => {
    const matchesSearch = prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prof.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || prof.category === selectedCategory;
    return matchesSearch && matchesCategory && prof.is_public;
  });

  return (
    <>
      <div className="space-y-6">
        {/* חיפוש וסינון */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder={language === 'he' ? 'חפש אנשי מקצוע...' : 'Search professionals...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* תוצאות */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfessionals.map((professional) => (
            <Card 
              key={professional.id} 
              className="hover:shadow-xl transition-all cursor-pointer border-0 shadow-lg overflow-hidden"
              onClick={() => setSelectedProfessional(professional)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {professional.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">{professional.name}</h3>
                      {professional.is_verified && (
                        <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{professional.specialty}</p>
                    
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-sm">{professional.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-xs text-gray-500">({professional.reviews_count || 0})</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {professional.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{professional.location}</span>
                    </div>
                  )}
                  {professional.years_experience && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{professional.years_experience} {language === 'he' ? 'שנות ניסיון' : 'years experience'}</span>
                    </div>
                  )}
                </div>

                {professional.skills && professional.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {professional.skills.slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {professional.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{professional.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    {professional.hourly_rate && (
                      <p className="text-lg font-bold text-indigo-600">
                        ₪{professional.hourly_rate}
                        <span className="text-sm text-gray-500">/{language === 'he' ? 'שעה' : 'hour'}</span>
                      </p>
                    )}
                  </div>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    <MessageSquare className="w-4 h-4 ml-2" />
                    {language === 'he' ? 'צור קשר' : 'Contact'}
                  </Button>
                </div>

                <Badge 
                  className={`mt-3 ${
                    professional.availability === 'available' 
                      ? 'bg-green-100 text-green-700' 
                      : professional.availability === 'busy'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {professional.availability === 'available' && (language === 'he' ? 'זמין' : 'Available')}
                  {professional.availability === 'busy' && (language === 'he' ? 'עסוק' : 'Busy')}
                  {professional.availability === 'unavailable' && (language === 'he' ? 'לא זמין' : 'Unavailable')}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProfessionals.length === 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">{language === 'he' ? 'לא נמצאו תוצאות' : 'No results found'}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedProfessional && (
        <ProfessionalDetailDialog
          professional={selectedProfessional}
          open={!!selectedProfessional}
          onClose={() => setSelectedProfessional(null)}
        />
      )}
    </>
  );
}