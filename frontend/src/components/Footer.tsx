export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">Elite Auto Services</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Professional automotive repair and maintenance services with over 20 years of experience.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#home" className="text-sm text-gray-400 hover:text-white transition-colors">Home</a></li>
              <li><a href="#about" className="text-sm text-gray-400 hover:text-white transition-colors">About</a></li>
              <li><a href="#vehicles" className="text-sm text-gray-400 hover:text-white transition-colors">Vehicles</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-2">
              <li><a href="tel:5551234567" className="text-sm text-gray-400 hover:text-white transition-colors">📞 (555) 123-4567</a></li>
              <li><a href="mailto:info@eliteauto.com" className="text-sm text-gray-400 hover:text-white transition-colors">✉️ info@eliteauto.com</a></li>
              <li className="text-sm text-gray-400">📍 123 Main St, Your City</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 Elite Auto Services. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}