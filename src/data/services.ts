import { Service } from "@/types";

export const services: Service[] = [
  { id: "S-01", name: "Home Maid Service", category: "Maid", description: "Daily or live-in house help for cleaning, laundry and chores.", basePrice: 25000, priceUnit: "month", activeProviders: 86, bookingsThisMonth: 312, isActive: true, icon: "sparkles" },
  { id: "S-02", name: "Home Cooking", category: "Cook", description: "Dedicated cooks for daily meal prep tailored to family needs.", basePrice: 30000, priceUnit: "month", activeProviders: 54, bookingsThisMonth: 198, isActive: true, icon: "chef-hat" },
  { id: "S-03", name: "Plumbing Repair", category: "Plumber", description: "On-demand leak fixes, pipe installation and bathroom fittings.", basePrice: 1200, priceUnit: "visit", activeProviders: 64, bookingsThisMonth: 441, isActive: true, icon: "wrench" },
  { id: "S-04", name: "Electrical Work", category: "Electrician", description: "Wiring, switchboard repair and appliance installation.", basePrice: 1500, priceUnit: "visit", activeProviders: 47, bookingsThisMonth: 276, isActive: true, icon: "zap" },
  { id: "S-05", name: "Child Care / Nanny", category: "Nanny", description: "Trained nannies for infant and toddler care at home.", basePrice: 28000, priceUnit: "month", activeProviders: 39, bookingsThisMonth: 121, isActive: true, icon: "baby" },
  { id: "S-06", name: "Personal Driver", category: "Driver", description: "Verified drivers for daily commute or full-time hire.", basePrice: 32000, priceUnit: "month", activeProviders: 28, bookingsThisMonth: 90, isActive: true, icon: "car" },
  { id: "S-07", name: "Gardening & Landscaping", category: "Gardener", description: "Lawn mowing, trimming and garden upkeep services.", basePrice: 900, priceUnit: "visit", activeProviders: 21, bookingsThisMonth: 65, isActive: false, icon: "flower" },
  { id: "S-08", name: "Deep House Cleaning", category: "Cleaner", description: "One-time or recurring deep cleaning for homes and offices.", basePrice: 3500, priceUnit: "visit", activeProviders: 33, bookingsThisMonth: 154, isActive: true, icon: "spray-can" },
];
