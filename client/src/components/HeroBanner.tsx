import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

const HeroBanner = () => {
  const { user } = useAuth();

  return (
    <div className="bg-secondary rounded-lg shadow-lg overflow-hidden mb-8">
      <div className="md:flex">
        <div className="md:flex-1 p-8 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white font-heading mb-4">
            Ready to test your knowledge and win?
          </h1>
          <p className="text-white text-opacity-90 mb-6">
            Join quiz tournaments, compete with others, and win exciting prizes!
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/tournaments">
              <div className="inline-block bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-md transition-colors text-center cursor-pointer">
                Join Tournament
              </div>
            </Link>
            <a
              href="#how-it-works"
              className="inline-block bg-white hover:bg-gray-100 text-secondary font-bold py-3 px-6 rounded-md transition-colors text-center"
            >
              How It Works
            </a>
          </div>
        </div>
        <div className="md:flex-1 flex items-center justify-center p-6">
          <img
            src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
            alt="Quiz Tournament Hero"
            className="rounded-lg shadow-lg max-h-72 object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
