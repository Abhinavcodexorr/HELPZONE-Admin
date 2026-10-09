"use client";

import { useState } from "react";
import { services as initialServices } from "@/data/services";
import { ServiceCard } from "./ServiceCard";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

export function ServicesGrid() {
  const [services, setServices] = useState(initialServices);

  function toggle(id: string) {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  }

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button size="sm">
          <Plus className="h-4 w-4" /> Add Service
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {services.map((s) => (
          <ServiceCard key={s.id} service={s} onToggle={toggle} />
        ))}
      </div>
    </div>
  );
}
