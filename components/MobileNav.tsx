"use client";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

interface Prop {
  className?: string;
}
const MobileNav = ({ className }: Prop) => {
  const [toggle, setToggle] = useState<boolean>(false);
  return (
    <div
      className={cn(
        "w-full flex items-center gap-4 justify-between",
        className
      )}
    >
      <Logo />
      <Sheet>
        <SheetTrigger className="p-3 text-white bg-purple-darker">
          {toggle ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </SheetTrigger>
        <SheetContent className=" border-none  outline-none text-white bg-purple-darker">
          <SheetHeader>
            <SheetTitle>Are you absolutely sure?</SheetTitle>
            <SheetDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNav;
