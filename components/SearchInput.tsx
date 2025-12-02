"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Input } from "./ui/input";
import { formUrlQuery, removeKeysFromUrlQuery } from "@jsmastery/utils";

const SearchInput = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        const newUrl = formUrlQuery({
          params: searchParams.toString(),
          key: "topic",
          value: searchQuery,
        });

        router.push(newUrl);
      } else {
        if (pathname === "/companions") {
          const newUrl = removeKeysFromUrlQuery({
            params: searchParams.toString(),
            keysToRemove: ["topic"],
          });

          router.push(newUrl);
        }
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, pathname]);

  return (
    <div className="relative flex items-center gap-2 w-[270px] rounded-lg border border-black px-3 py-2">
      <Image
        src="/icons/search.svg"
        alt="search"
        width={18}
        height={18}
        className="opacity-70"
      />
      <Input
        placeholder="Search your companions..."
        className="w-full border-none outline-none focus-visible:ring-0 shadow-none py-5.1"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
