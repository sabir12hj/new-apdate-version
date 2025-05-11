import { Trophy, Facebook, Twitter, Instagram } from "lucide-react";
import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Trophy className="text-primary h-6 w-6 mr-2" />
              <span className="font-heading font-bold text-xl">QuizTournament</span>
            </div>
            <p className="text-gray-400 mb-4">
              Join exciting quiz tournaments and win real prizes! Test your knowledge across various categories.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <div className="text-gray-400 hover:text-white cursor-pointer">Home</div>
                </Link>
              </li>
              <li>
                <Link href="/tournaments">
                  <div className="text-gray-400 hover:text-white cursor-pointer">Tournaments</div>
                </Link>
              </li>
              <li>
                <Link href="/leaderboard">
                  <div className="text-gray-400 hover:text-white cursor-pointer">Leaderboard</div>
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="text-gray-400 hover:text-white">How to Play</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white">FAQ</a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">Contact Us</a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Download App</h3>
            <p className="text-gray-400 mb-4">Get the full experience on your mobile device.</p>
            <div className="flex flex-col space-y-2">
              <a
                href="#"
                className="bg-gray-700 hover:bg-gray-600 rounded-md px-4 py-2 flex items-center"
              >
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5v-17C3,2.67,3.67,2,4.5,2h15C20.33,2,21,2.67,21,3.5v17c0,0.83-0.67,1.5-1.5,1.5h-15C3.67,22,3,21.33,3,20.5z M12,17l7-4l-7-4V17z"/>
                </svg>
                <div>
                  <div className="text-xs">GET IT ON</div>
                  <div className="font-medium">Google Play</div>
                </div>
              </a>
              <a
                href="#"
                className="bg-gray-700 hover:bg-gray-600 rounded-md px-4 py-2 flex items-center"
              >
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.53,11.06 L12.85,7.39 L12.85,1.05 L20.96,9.16 L16.53,11.06 Z M11.52,7.39 L7.83,11.06 L3.41,9.16 L11.52,1.05 L11.52,7.39 Z M12.83,23.01 L11.52,23.01 L11.52,15.01 L7.82,15.01 L7.82,16.34 L3.41,14.44 L11.52,6.33 L12.83,7.63 L12.83,23.01 Z M20.97,14.44 L16.55,16.34 L16.55,15.01 L12.86,15.01 L12.86,23.01 L11.54,23.01 L11.54,7.63 L12.85,6.33 L20.97,14.44 Z"/>
                </svg>
                <div>
                  <div className="text-xs">Download on the</div>
                  <div className="font-medium">App Store</div>
                </div>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; 2024 QuizTournament. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
