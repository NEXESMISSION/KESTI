import React, { useState } from 'react';

interface ContactFormProps {
  className?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ className }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus(null);

    const formData = {
      name,
      phone,
      email,
      message,
      timestamp: new Date().toISOString(),
    };

    try {
      // استخدام API route بدلاً من الاتصال المباشر بـ Google Apps Script لتجنب مشاكل CSP
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      setFormStatus({
        success: true,
        message: result.message || 'تم إرسال رسالتك بنجاح! سنتواصل معك قريبًا.',
      });

      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormStatus({
        success: false,
        message: 'حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى أو تواصل معنا مباشرة عبر الواتساب.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl p-6 md:p-8 ${className}`}>
      <h3 className="text-[20px] md:text-[24px] lg:text-[28px] font-bold text-gray-900 mb-4 text-center">استفسر عن الميزات</h3>
      
      {formStatus && (
        <div 
          className={`mb-4 p-4 rounded-lg text-center ${
            formStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {formStatus.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-gray-700 text-[16px] mb-1 font-medium">
            الاسم الكامل
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition-all"
            placeholder="أدخل اسمك الكامل"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-gray-700 text-[16px] mb-1 font-medium">
            رقم الهاتف
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition-all"
            placeholder="أدخل رقم هاتفك"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-gray-700 text-[16px] mb-1 font-medium">
            البريد الإلكتروني (اختياري)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition-all"
            placeholder="أدخل بريدك الإلكتروني"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-gray-700 text-[16px] mb-1 font-medium">
            استفسارك
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition-all resize-none"
            placeholder="اكتب استفسارك أو متطلبات محلك هنا"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white text-[18px] font-bold rounded-xl transition-colors duration-300 flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              جاري الإرسال...
            </>
          ) : (
            'إرسال الاستفسار'
          )}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
