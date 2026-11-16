import React from "react";
import { createRoot } from "react-dom/client";
import "./rankingFixture.css";
import Page from "../../client/src/pages/AdminQuestionBatchImportPage";
createRoot(document.getElementById("root")!).render(
  <div className="mx-auto max-w-7xl space-y-5 p-6">
    <p className="rounded-xl bg-amber-100 p-3 text-amber-950">
      Fixture local com dados sintéticos. Sem autenticação, banco ou Storage
      remoto.
    </p>
    <Page />
  </div>
);
