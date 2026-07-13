"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Modal } from "./Modal";
import type { FuelPricesPublic } from "@/lib/api";
import type { CalculatorSettings } from "@kr/shared/types";

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (n: number) => n.toFixed(2);

// Savings Calculator — fields, flow and maths mirror krfules.com:
//   daily savings  = petrol daily expense − Auto-LPG daily expense
//   monthly        = daily × 25 (working days)
//   yearly         = monthly × 12
//   kit ROI months = kit cost ÷ monthly savings
// Auto-LPG mileage is derived from the petrol mileage via the admin-managed
// lpgMileageFactor; the petrol/LPG unit prices pre-fill from live rates but stay
// editable, exactly like the reference calculator's "Current cost" inputs.
export function SavingsModal({
  open,
  onClose,
  prices,
  settings,
}: {
  open: boolean;
  onClose: () => void;
  prices: FuelPricesPublic;
  settings: CalculatorSettings;
}) {
  const factor = settings.lpgMileageFactor || 0.9;
  const initialPetrol = prices.petrol ? String(prices.petrol) : "";
  const initialLpg = prices.autoLPG ? String(prices.autoLPG) : "";

  const [step, setStep] = useState<"form" | "result">("form");
  const [km, setKm] = useState("");
  const [petrolMileage, setPetrolMileage] = useState("");
  const [petrolCost, setPetrolCost] = useState(initialPetrol);
  const [lpgCost, setLpgCost] = useState(initialLpg);
  const [kitCost, setKitCost] = useState("");

  const r = useMemo(() => {
    const distance = num(km);
    const pMileage = num(petrolMileage);
    const lMileage = pMileage * factor;
    const pFuel = pMileage > 0 ? distance / pMileage : 0;
    const lFuel = lMileage > 0 ? distance / lMileage : 0;
    const pExpense = pFuel * num(petrolCost);
    const lExpense = lFuel * num(lpgCost);
    const daily = pExpense - lExpense;
    const monthly = daily * 25;
    const yearly = monthly * 12;
    const kit = num(kitCost);
    const roi = monthly > 0 && kit > 0 ? kit / monthly : 0;
    return { pFuel, lMileage, lFuel, pExpense, lExpense, daily, monthly, yearly, roi };
  }, [km, petrolMileage, petrolCost, lpgCost, kitCost, factor]);

  // Every field the visitor fills in starts blank; only the petrol/LPG unit
  // prices are seeded from the live rates.
  const reset = useCallback(() => {
    setKm("");
    setPetrolMileage("");
    setKitCost("");
    setPetrolCost(initialPetrol);
    setLpgCost(initialLpg);
  }, [initialPetrol, initialLpg]);

  // This component stays mounted while the modal is shut, so without this the
  // previous visitor's figures would still be there on the next open.
  useEffect(() => {
    if (!open) return;
    setStep("form");
    reset();
  }, [open, reset]);

  // Modal stays mounted across open/close, so return to the form on close.
  const close = () => { setStep("form"); onClose(); };

  const field = "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand";
  const fieldRO = "mt-1.5 w-full rounded-xl border border-line bg-cream px-4 py-3 text-sm text-ink/60";
  const lbl = "text-[11px] font-semibold uppercase tracking-wide text-mutedfg";
  const ro = (n: number) => (n ? money(n) : "");

  return (
    <Modal open={open} onClose={close} label="Savings Calculator">
      <div className="p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-pale text-brand"><Calculator size={20} /></span>
          <h2 className="text-2xl font-extrabold text-ink">Savings Calculator{step === "result" ? " — Result" : ""}</h2>
        </div>

        {step === "form" ? (
          <>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              {/* ── Petrol column ─────────────────────────────── */}
              <div>
                <h3 className="mb-3 text-lg font-bold text-ink">Petrol</h3>
                <label className="block"><span className={lbl}>Daily vehicle running in kms *</span>
                  <input type="number" inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} className={field} /></label>
                <label className="mt-3 block"><span className={lbl}>Your vehicle mileage (km/liter) *</span>
                  <input type="number" inputMode="decimal" value={petrolMileage} onChange={(e) => setPetrolMileage(e.target.value)} className={field} /></label>
                <label className="mt-3 block"><span className={lbl}>Daily fuel consumption in liter</span>
                  <input readOnly value={ro(r.pFuel)} className={fieldRO} /></label>
                <label className="mt-3 block"><span className={lbl}>Current cost of petrol</span>
                  <input type="number" inputMode="decimal" value={petrolCost} onChange={(e) => setPetrolCost(e.target.value)} className={field} /></label>
                <label className="mt-3 block"><span className={lbl}>Daily petrol expense</span>
                  <input readOnly value={ro(r.pExpense)} className={fieldRO} /></label>
              </div>

              {/* ── Auto LPG column (derived) ─────────────────── */}
              <div>
                <h3 className="mb-3 text-lg font-bold text-brand">Auto LPG</h3>
                <label className="block"><span className={lbl}>Daily vehicle running in kms</span>
                  <input readOnly value={km} className={fieldRO} /></label>
                <label className="mt-3 block"><span className={lbl}>Your vehicle mileage (km/liter)</span>
                  <input readOnly value={ro(r.lMileage)} className={fieldRO} /></label>
                <label className="mt-3 block"><span className={lbl}>Daily fuel consumption in liter</span>
                  <input readOnly value={ro(r.lFuel)} className={fieldRO} /></label>
                <label className="mt-3 block"><span className={lbl}>Current cost of LPG</span>
                  <input type="number" inputMode="decimal" value={lpgCost} onChange={(e) => setLpgCost(e.target.value)} className={field} /></label>
                <label className="mt-3 block"><span className={lbl}>Daily LPG expense</span>
                  <input readOnly value={ro(r.lExpense)} className={fieldRO} /></label>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button onClick={() => setStep("result")} className="btn-primary flex-1">Result</button>
              <button onClick={reset} className="btn-outline">Reset</button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {([
                ["Daily Savings ₹", r.daily],
                ["Monthly Savings ₹ (25 days)", r.monthly],
                ["Yearly Savings ₹ (25 days × 12 Months)", r.yearly],
              ] as const).map(([l, v]) => (
                <div key={l} className="rounded-2xl bg-brand-pale p-4 text-center">
                  <div className="text-[10px] font-bold uppercase leading-tight tracking-wider text-mutedfg">{l}</div>
                  <div className="mt-1.5 break-words text-2xl font-extrabold text-brand tabular-nums">₹{money(v)}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-line p-5">
              <h3 className="mb-4 text-base font-bold text-ink">Conversion Kit</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block"><span className={lbl}>Cost you pay for kit ₹</span>
                  <input type="number" inputMode="decimal" value={kitCost} onChange={(e) => setKitCost(e.target.value)} className={field} /></label>
                <label className="block"><span className={lbl}>Return On Investment (in Months)</span>
                  <input readOnly value={money(r.roi)} className={fieldRO} /></label>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button onClick={close} className="btn-primary flex-1">Close</button>
              <button onClick={() => setStep("form")} className="btn-outline">Back</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
