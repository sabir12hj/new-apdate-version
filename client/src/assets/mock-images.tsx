// This file contains URLs for quiz tournament related images used throughout the application

// Tournament featured images
export const tournamentImages = {
  generalKnowledge: "https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  sports: "https://images.unsplash.com/photo-1613202968096-38809315aa2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  movies: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  science: "https://images.unsplash.com/photo-1605711285791-0219e80e43a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  default: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
};

// Hero banner image
export const heroBannerImage = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";

// Trophy/prize images
export const trophyImages = {
  gold: "https://images.unsplash.com/photo-1614036634955-ae5e90f9b9eb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  medal: "https://images.unsplash.com/photo-1611323593958-f9f978ecc7c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
};

// Payment related images
export const paymentImages = {
  wallet: "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  creditCard: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
};

// Function to get tournament image based on name
export const getTournamentImageByName = (name: string): string => {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes("knowledge") || nameLower.includes("general")) {
    return tournamentImages.generalKnowledge;
  }
  if (nameLower.includes("sport")) {
    return tournamentImages.sports;
  }
  if (nameLower.includes("movie") || nameLower.includes("film") || nameLower.includes("cinema")) {
    return tournamentImages.movies;
  }
  if (nameLower.includes("science") || nameLower.includes("tech")) {
    return tournamentImages.science;
  }
  
  return tournamentImages.default;
};

export default {
  tournamentImages,
  heroBannerImage,
  trophyImages,
  paymentImages,
  getTournamentImageByName,
};
