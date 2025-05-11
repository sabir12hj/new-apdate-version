import { Link } from "wouter";
import React from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { Progress } from "@/components/ui/progress";
import { Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TournamentCardProps {
  tournament: {
    id: number;
    name: string;
    entryFee: string;
    prizePool: string;
    totalSlots: number;
    startTime: string;
    endTime: string;
  };
  participantsCount: number;
  isLive?: boolean;
}

const TournamentCard = ({ tournament, participantsCount, isLive = false }: TournamentCardProps) => {
  const targetDate = isLive 
    ? new Date(tournament.endTime) 
    : new Date(tournament.startTime);
  
  // Memoize the date to prevent re-renders
  const memoizedDate = React.useMemo(() => targetDate, [tournament.endTime, tournament.startTime, isLive]);
  
  const { timeLeft, isExpired } = useCountdown(memoizedDate);
  
  const percentFilled = Math.min(
    Math.round((participantsCount / tournament.totalSlots) * 100),
    100
  );
  
  // Image selection for card
  const imageMap: Record<string, string> = {
    "General Knowledge": "https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "Sports": "https://images.unsplash.com/photo-1613202968096-38809315aa2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "Movies": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "Science": "https://images.unsplash.com/photo-1605711285791-0219e80e43a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
  };
  
  // Find image based on name keywords
  const getImage = () => {
    for (const [keyword, url] of Object.entries(imageMap)) {
      if (tournament.name.toLowerCase().includes(keyword.toLowerCase())) {
        return url;
      }
    }
    // Default image if no match
    return "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={getImage()}
          alt={tournament.name}
          className="w-full h-48 object-cover"
        />
        <div className={`absolute top-0 right-0 ${isLive ? 'bg-secondary' : 'bg-warning'} text-white rounded-bl-lg px-3 py-1`}>
          <span className="font-accent">{isLive ? 'LIVE NOW' : 'UPCOMING'}</span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between mb-2">
          <h3 className="font-bold text-lg">{tournament.name}</h3>
          <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
            ₹{parseInt(tournament.entryFee).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <span>
            <Users className="inline h-4 w-4 mr-1" />{" "}
            {participantsCount}/{tournament.totalSlots} joined
          </span>
          <span>
            <Trophy className="inline h-4 w-4 mr-1" /> ₹
            {parseInt(tournament.prizePool).toLocaleString()} prize
          </span>
        </div>
        <Progress value={percentFilled} className="h-2 mb-2" />
        <div className="flex justify-between mb-4 text-sm">
          <span className="text-gray-600">
            {isLive ? "Ending in:" : "Starts in:"}
          </span>
          <span className={`font-accent font-bold ${isLive ? 'text-error' : ''}`}>
            {isExpired 
              ? (isLive ? "Ended" : "Started") 
              : `${timeLeft.hours.toString().padStart(2, '0')}:${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`
            }
          </span>
        </div>
        <Link href={`/tournaments/${tournament.id}`}>
          <a className="block">
            <Button 
              className="w-full" 
              variant={isLive ? "default" : "secondary"}
            >
              {isLive ? "Join Now" : "Register Now"}
            </Button>
          </a>
        </Link>
      </div>
    </div>
  );
};

export default TournamentCard;
