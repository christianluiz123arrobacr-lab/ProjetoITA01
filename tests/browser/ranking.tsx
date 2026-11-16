import React from "react";
import { createRoot } from "react-dom/client";
import "./rankingFixture.css";
import RankingPage from "../../client/src/pages/RankingPage";
document.documentElement.classList.toggle(
  "dark",
  new URLSearchParams(location.search).get("theme") === "dark"
);
createRoot(document.getElementById("root")!).render(<RankingPage />);
