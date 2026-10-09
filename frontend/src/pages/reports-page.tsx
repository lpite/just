// @ts-nocheck
import { useEffect } from "react";
import { NavBar } from "../components/nav-bar";

export default function ReportsPage() {
  // useEffect(()=>{
  //   document.addEventListener("keydown",(e)=>{
  //     console.log(e.keyCode)
  //   })
  // })
  return (
    <main className="p-4">
      <NavBar />
      {/*<form>*/}
      <input onKeyDown={(e)=>console.log(e.key)}/>
        
      {/*</form>*/}
      <h1 className="text-3xl">Звіти</h1>
    </main>
  );
}
