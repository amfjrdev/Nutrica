import { Star } from 'lucide-react';

const TestimonialCard = ({ quote, author, role }) => (
  <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
    <div className="flex space-x-1 mb-4">
      {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-emerald-500 fill-current" />)}
    </div>
    <p className="text-slate-600 mb-6 italic">"{quote}"</p>
    <div>
      <p className="font-bold text-slate-900">{author}</p>
      <p className="text-sm text-slate-500">{role}</p>
    </div>
  </div>
);

const testimonials = [
  { quote: "The personalized nutrition plan changed my life. I finally found a sustainable approach to healthy eating!", author: "Emily Roberts", role: "Lost 15 lbs" },
  { quote: "Working with a dedicated nutritionist helped me optimize my performance. Highly recommended!", author: "Michael Chen", role: "Athlete" },
  { quote: "The AI chatbot is incredibly helpful for quick questions. The plans are easy to follow even with my hectic schedule.", author: "Sarah Williams", role: "Busy Professional" },
];

const Testimonials = () => (
  <section className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What Our Clients Say</h2>
        <p className="text-lg text-slate-600">Real stories from real people</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => <TestimonialCard key={i} {...t} />)}
      </div>
    </div>
  </section>
);

export default Testimonials;
