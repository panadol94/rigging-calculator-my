import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  FileText,
  Ruler,
  Scale,
  ShieldCheck,
} from "lucide-react";
import "./styles.css";

const defaults = {
  loadKg: 6000,
  riggingKg: 2000,
  slingLengthM: 0.6,
  lengthM: 0.3,
  widthM: 0.3,
  wllKg: 3250,
};

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fmt(value, digits = 2) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("ms-MY", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function fmtWhole(value) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("ms-MY", {
    maximumFractionDigits: 0,
  }).format(value);
}

function calc(input) {
  const totalKg = input.loadKg + input.riggingKg;
  const horizontalM = Math.sqrt(input.lengthM ** 2 + input.widthM ** 2);
  const heightSquared = input.slingLengthM ** 2 - horizontalM ** 2;
  const heightM = heightSquared >= 0 ? Math.sqrt(heightSquared) : NaN;
  const sinAngle = heightM / input.slingLengthM;
  const angleDeg =
    Number.isFinite(sinAngle) && sinAngle >= -1 && sinAngle <= 1
      ? (Math.asin(sinAngle) * 180) / Math.PI
      : NaN;
  const verticalPerLegKg = totalKg / 4;
  const tensionKg = verticalPerLegKg / Math.sin((angleDeg * Math.PI) / 180);
  const margin = input.wllKg / tensionKg;

  return {
    totalKg,
    horizontalM,
    heightSquared,
    heightM,
    sinAngle,
    angleDeg,
    verticalPerLegKg,
    tensionKg,
    margin,
    passed:
      Number.isFinite(tensionKg) && input.wllKg > 0 && input.wllKg >= tensionKg,
    geometryOk: heightSquared >= 0 && input.slingLengthM > 0,
  };
}

function Field({ icon: Icon, label, suffix, value, onChange, step = "0.001" }) {
  return (
    <label className="field">
      <span>
        <Icon size={16} />
        {label}
      </span>
      <div className="inputRow">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          onChange={(event) => onChange(num(event.target.value))}
        />
        <b>{suffix}</b>
      </div>
    </label>
  );
}

function ResultPill({ label, value }) {
  return (
    <div className="pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Step({ number, title, formula, children }) {
  return (
    <section className="step">
      <div className="stepIndex">{number}</div>
      <div>
        <h3>{title}</h3>
        <p className="formula">{formula}</p>
        <div className="calcText">{children}</div>
      </div>
    </section>
  );
}

function App() {
  const [input, setInput] = useState(defaults);
  const result = useMemo(() => calc(input), [input]);

  const setValue = (key) => (value) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const warning =
    !result.geometryOk &&
    "Panjang sling terlalu pendek untuk jarak mendatar ini. Naikkan panjang sling atau kecilkan jarak lifting point.";

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Bahasa Melayu | kg dan meter</p>
          <h1>Kalkulator Rigging 4-Leg Sling</h1>
        </div>
        <div className="topIcon" title="Kiraan scientific calculator">
          <Calculator size={26} />
        </div>
      </header>

      <section className="layout">
        <aside className="panel">
          <div className="panelTitle">
            <FileText size={18} />
            <h2>Input Data</h2>
          </div>
          <div className="fields">
            <Field
              icon={Scale}
              label="Berat beban"
              suffix="kg"
              value={input.loadKg}
              onChange={setValue("loadKg")}
              step="1"
            />
            <Field
              icon={Scale}
              label="Berat rigging bawah hook"
              suffix="kg"
              value={input.riggingKg}
              onChange={setValue("riggingKg")}
              step="1"
            />
            <Field
              icon={Ruler}
              label="Panjang sling, S"
              suffix="m"
              value={input.slingLengthM}
              onChange={setValue("slingLengthM")}
            />
            <Field
              icon={Ruler}
              label="Jarak arah panjang, L"
              suffix="m"
              value={input.lengthM}
              onChange={setValue("lengthM")}
            />
            <Field
              icon={Ruler}
              label="Jarak arah lebar, d"
              suffix="m"
              value={input.widthM}
              onChange={setValue("widthM")}
            />
            <Field
              icon={ShieldCheck}
              label="WLL sling setiap leg"
              suffix="kg"
              value={input.wllKg}
              onChange={setValue("wllKg")}
              step="1"
            />
          </div>
        </aside>

        <section className="content">
          <div className={`status ${result.passed ? "pass" : "fail"}`}>
            {result.passed ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            <div>
              <span>Status semakan WLL</span>
              <strong>
                {result.passed ? "LULUS" : result.geometryOk ? "TIDAK LULUS" : "SEMAK INPUT"}
              </strong>
            </div>
          </div>

          {warning && <p className="warning">{warning}</p>}

          <div className="summary">
            <ResultPill label="Jumlah berat" value={`${fmtWhole(result.totalKg)} kg`} />
            <ResultPill label="Jarak mendatar" value={`${fmt(result.horizontalM, 3)} m`} />
            <ResultPill label="Tinggi hook" value={`${fmt(result.heightM, 3)} m`} />
            <ResultPill label="Sudut sling" value={`${fmt(result.angleDeg, 1)} deg`} />
            <ResultPill label="Tension / leg" value={`${fmtWhole(result.tensionKg)} kg`} />
            <ResultPill label="Margin WLL" value={`${fmt(result.margin, 2)} kali`} />
          </div>

          <section className="report">
            <div className="reportTitle">
              <h2>Jalan Kiraan Lengkap</h2>
              <p>Format ini ikut cara tekan scientific calculator.</p>
            </div>

            <Step number="1" title="Kira jumlah berat" formula="Jumlah Berat = Berat Beban + Berat Rigging">
              <p>Jumlah Berat = {fmtWhole(input.loadKg)} + {fmtWhole(input.riggingKg)}</p>
              <p>{fmtWhole(input.loadKg)} + {fmtWhole(input.riggingKg)} = {fmtWhole(result.totalKg)} kg</p>
              <p>Dalam tan: {fmtWhole(result.totalKg)} / 1,000 = {fmt(result.totalKg / 1000, 2)} tan</p>
            </Step>

            <Step number="2" title="Kira jarak mendatar 3D setiap leg" formula="R = sqrt(L^2 + d^2)">
              <p>R = sqrt({fmt(input.lengthM, 3)}^2 + {fmt(input.widthM, 3)}^2)</p>
              <p>{fmt(input.lengthM, 3)}^2 = {fmt(input.lengthM ** 2, 3)}</p>
              <p>{fmt(input.widthM, 3)}^2 = {fmt(input.widthM ** 2, 3)}</p>
              <p>{fmt(input.lengthM ** 2, 3)} + {fmt(input.widthM ** 2, 3)} = {fmt(input.lengthM ** 2 + input.widthM ** 2, 3)}</p>
              <p>sqrt({fmt(input.lengthM ** 2 + input.widthM ** 2, 3)}) = {fmt(result.horizontalM, 3)} m</p>
            </Step>

            <Step number="3" title="Kira tinggi hook ke lifting point" formula="H = sqrt(S^2 - R^2)">
              <p>H = sqrt({fmt(input.slingLengthM, 3)}^2 - {fmt(result.horizontalM, 3)}^2)</p>
              <p>{fmt(input.slingLengthM, 3)}^2 = {fmt(input.slingLengthM ** 2, 3)}</p>
              <p>{fmt(result.horizontalM, 3)}^2 = {fmt(result.horizontalM ** 2, 3)}</p>
              <p>{fmt(input.slingLengthM ** 2, 3)} - {fmt(result.horizontalM ** 2, 3)} = {fmt(result.heightSquared, 3)}</p>
              <p>sqrt({fmt(result.heightSquared, 3)}) = {fmt(result.heightM, 3)} m</p>
            </Step>

            <Step number="4" title="Kira sudut sling dari horizontal" formula="theta = sin^-1(H / S)">
              <p>theta = sin^-1({fmt(result.heightM, 3)} / {fmt(input.slingLengthM, 3)})</p>
              <p>{fmt(result.heightM, 3)} / {fmt(input.slingLengthM, 3)} = {fmt(result.sinAngle, 4)}</p>
              <p>sin^-1({fmt(result.sinAngle, 4)}) = {fmt(result.angleDeg, 2)} deg</p>
              <p className="note">Pastikan scientific calculator berada dalam mode DEG, bukan RAD.</p>
            </Step>

            <Step number="5" title="Kira beban menegak setiap leg" formula="Beban Setiap Leg = Jumlah Berat / 4">
              <p>Beban setiap leg = {fmtWhole(result.totalKg)} / 4</p>
              <p>{fmtWhole(result.totalKg)} / 4 = {fmtWhole(result.verticalPerLegKg)} kg</p>
            </Step>

            <Step number="6" title="Kira tension sebenar setiap sling" formula="Tension = Beban Setiap Leg / sin(theta)">
              <p>Tension = {fmtWhole(result.verticalPerLegKg)} / sin({fmt(result.angleDeg, 2)})</p>
              <p>sin({fmt(result.angleDeg, 2)}) = {fmt(Math.sin((result.angleDeg * Math.PI) / 180), 4)}</p>
              <p>{fmtWhole(result.verticalPerLegKg)} / {fmt(Math.sin((result.angleDeg * Math.PI) / 180), 4)} = {fmtWhole(result.tensionKg)} kg</p>
              <p>Dalam tan: {fmtWhole(result.tensionKg)} / 1,000 = {fmt(result.tensionKg / 1000, 2)} tan</p>
            </Step>

            <Step number="7" title="Semak WLL sling" formula="WLL Sling >= Tension Sebenar">
              <p>WLL sling = {fmtWhole(input.wllKg)} kg</p>
              <p>Tension sebenar = {fmtWhole(result.tensionKg)} kg</p>
              <p>{fmtWhole(input.wllKg)} {result.passed ? ">=" : "<"} {fmtWhole(result.tensionKg)}</p>
              <p>Status: {result.passed ? "LULUS" : "TIDAK LULUS"}</p>
            </Step>

            <Step number="8" title="Kira margin keselamatan" formula="Margin = WLL Sling / Tension Sebenar">
              <p>Margin = {fmtWhole(input.wllKg)} / {fmtWhole(result.tensionKg)}</p>
              <p>{fmtWhole(input.wllKg)} / {fmtWhole(result.tensionKg)} = {fmt(result.margin, 2)} kali</p>
            </Step>
          </section>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
