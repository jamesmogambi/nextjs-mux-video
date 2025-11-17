import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const loading = () => {
  return (
    <div className=" ">
      <div className="flex items-center gap-6">
        <Skeleton className="h-[300px] w-[500px]  bg-purple-darker" />
        <Skeleton className="h-[300px] w-[500px]  bg-purple-darker" />
        <Skeleton className="h-[300px] w-[500px]  bg-purple-darker" />

        {/* <Skeleton className="h-[300px] w-[500px] " />
        <Skeleton className="h-[300px] w-[500px] " /> */}
      </div>
    </div>
  );
};

export default loading;
