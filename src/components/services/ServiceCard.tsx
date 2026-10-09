"use client";

import { Service } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ServiceIcon } from "./ServiceIcon";
import { Users, CalendarCheck } from "lucide-react";

export function ServiceCard({
  service,
  onToggle,
}: {
  service: Service;
  onToggle: (id: string) => void;
}) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <ServiceIcon name={service.icon} className="h-5 w-5" />
        </div>
        <button
          onClick={() => onToggle(service.id)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            service.isActive ? "bg-emerald-500" : "bg-gray-200"
          }`}
          aria-label="Toggle service active"
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              service.isActive ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <h3 className="mt-4 text-sm font-semibold text-gray-900">{service.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{service.description}</p>

      <div className="mt-3 flex items-center gap-2">
        <Badge tone="indigo">{service.category}</Badge>
        <Badge tone={service.isActive ? "green" : "gray"}>
          {service.isActive ? "Active" : "Disabled"}
        </Badge>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {service.activeProviders} providers
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5" />
          {service.bookingsThisMonth} bookings
        </div>
      </div>

      <div className="mt-3 text-sm font-semibold text-gray-900">
        ₹{service.basePrice.toLocaleString("en-IN")}
        <span className="text-xs font-normal text-gray-400"> / {service.priceUnit}</span>
      </div>
    </Card>
  );
}
