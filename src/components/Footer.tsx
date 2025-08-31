import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-neutral-900 text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">Basic Ecommerce Store</h3>
            <p className="text-neutral-300">
              Your trusted online destination for quality products at great prices. 
              We're committed to providing excellent customer service and fast delivery.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <nav className="flex flex-col space-y-2">
              <Link to="/" className="text-neutral-300 hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/products" className="text-neutral-300 hover:text-primary transition-colors">
                Products
              </Link>
              <button
                onClick={() => scrollToSection('categories')}
                className="text-left text-neutral-300 hover:text-primary transition-colors"
              >
                Categories
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-left text-neutral-300 hover:text-primary transition-colors"
              >
                About Us
              </button>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Customer Service</h4>
            <nav className="flex flex-col space-y-2">
              <Link to="/cart" className="text-neutral-300 hover:text-primary transition-colors">
                Shopping Cart
              </Link>
              <Link to="/profile" className="text-neutral-300 hover:text-primary transition-colors">
                My Account
              </Link>
              <a href="#" className="text-neutral-300 hover:text-primary transition-colors">
                Shipping Info
              </a>
              <a href="#" className="text-neutral-300 hover:text-primary transition-colors">
                Returns & Exchanges
              </a>
              <a href="#" className="text-neutral-300 hover:text-primary transition-colors">
                FAQ
              </a>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-neutral-300">
                  123 Commerce Street<br />
                  Business District, BD 12345
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-neutral-300">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-primary" />
                <span className="text-neutral-300">support@basicecommerce.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-8 pt-8 text-center">
          <p className="text-neutral-400">
            &copy; 2024 Basic Ecommerce Store. All rights reserved. | 
            <a href="#" className="hover:text-primary transition-colors ml-1">Privacy Policy</a> | 
            <a href="#" className="hover:text-primary transition-colors ml-1">Terms of Service</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;