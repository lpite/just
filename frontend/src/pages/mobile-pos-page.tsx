// @ts-nocheck
import {
  BottomNavigation,
  BottomNavigationAction,
  Input,
  TextField,
} from "@mui/material";
import { FormEvent, useState } from "react";
import useSWR from "swr";
import { Route } from "wouter";

export function MobilePosPage() {
  const [searchValue, setSearchValue] = useState("");
  const [showCart, setShowCart] = useState(false);

  const {
    data: products,
    isLoading,
    mutate,
  } = useSWR(
    ["fts", searchValue],
    () =>
      fetch(`http://localhost:3000/api/search?q=${searchValue}`).then((r) =>
        r.json(),
      ) as { items: any[] },
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const searchValue = data.get("searchValue")?.toString().trim();
    if (searchValue) {
      setSearchValue(searchValue);
    }
  }

  return (
    <main className="h-full p-2 flex flex-col">
      {showCart ? (
        <div className="fixed w-full h-full top-0 start-0 bg-white flex flex-col z-5 p-2">
          <h2 className="text-2xl">Кошик</h2>
          <div className="grow"></div>
          <div></div>
        </div>
      ) : null}
      <form onSubmit={onSubmit}>
        <TextField
          variant="outlined"
          size="small"
          className="w-full"
          name="searchValue"
        />
      </form>
      <div className="flex flex-col gap-1 pt-3 overflow-y-auto mb-12">
        {products?.items.map((el) => (
          <div key={el.id} className="border border-gray-300 rounded-sm p-1">
            {el.id}

            {el.name}
          </div>
        ))}
      </div>
      <BottomNavigation showLabels className="fixed bottom-0 w-full z-10 h-3">
        <BottomNavigationAction
          label="Товари"
          value="products"
          onClick={() => setShowCart(false)}
        />
        <BottomNavigationAction
          label="Кошик"
          value="cart"
          onClick={() => setShowCart(true)}
        />
      </BottomNavigation>
    </main>
  );
}
