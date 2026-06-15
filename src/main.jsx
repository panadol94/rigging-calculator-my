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

const slingNames = ["Sling 1", "Sling 2", "Sling 3", "Sling 4"];

const defaults = {
  loadKg: 6000,
  riggingKg: 2000,
  slingLengthsM: [0.6, 0.6, 0.6, 0.6],
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

function calcLeg(name, slingLengthM, horizontalM, verticalPerLegKg, wllKg) {
  const heightSquared = slingLengthM ** 2 - horizontalM ** 2;
  const heightM = heightSquared >= 0 ? Math.sqrt(heightSquared) : NaN;
  const sinAngle = heightM / slingLengthM;
  const angleDeg =
    Number.isFinite(sinAngle) && sinAngle >= -1 && sinAngle <= 1
      ? (Math.asin(sinAngle) * 180) / Math.PI
      : NaN;
  const sinTheta = Math.sin((angleDeg * Math.PI) / 180);
  const tensionKg = verticalPerLegKg / sinTheta;
  const margin = wllKg / tensionKg;
  const geometryOk = heightSquared >= 0 && slingLengthM > 0;

  return {
    name,
    slingLengthM,
    heightSquared,
    heightM,
    sinAngle,
    angleDeg,
    sinTheta,
    tensionKg,
    margin,
    geometryOk,
    passed: geometryOk && Number.isFinite(tensionKg) && wllKg >= tensionKg,
  };
}

function calc(input) {
  const totalKg = input.loadKg + input.riggingKg;
  const horizontalM = Math.sqrt(input.lengthM ** 2 + input.widthM ** 2);
  const verticalPerLegKg = totalKg / 4;
  const legs = input.slingLengthsM.map((length, index) =>
    calcLeg(slingNames[index], length, horizontalM, verticalPerLegKg, input.wllKg),
  );
  const validTensions = legs
    .map((leg) => leg.tensionKg)
    .filter((value) => Number.isFinite(value));
  const maxTensionKg = validTensions.length ? Math.max(...validTensions) : NaN;
  const minMargin = Math.min(
    ...legs.map((leg) => leg.margin).filter((value) => Number.isFinite(value)),
  );
  const worstLeg =
    legs.find((leg) => leg.tensionKg === maxTensionKg) ?? legs.find((leg) => !leg.geometryOk) ?? legs[0];
  const allGeometryOk = legs.every((leg) => leg.geometryOk);
  const passed = allGeometryOk && legs.every((leg) => leg.passed);

  return {
    totalKg,
    horizontalM,
    verticalPerLegKg,
    legs,
    worstLeg,
    maxTensionKg,
    minMargin,
    allGeometryOk,
    passed,
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

function MiniInput({ label, suffix, value, onChange, step = "0.001" }) {
  return (
    <label className="miniInput">
      <span>{label}</span>
      <div>
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

function DiagramInput({ label, suffix, value, onChange, step = "0.001", tone = "dark" }) {
  return (
    <label className={`diagramInput ${tone}`}>
      <span>{label}</span>
      <em>=</em>
      <span className="diagramValue">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          onChange={(event) => onChange(num(event.target.value))}
        />
        <b>{suffix}</b>
      </span>
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

function FormulaBox({ label, value }) {
  return (
    <div className="formulaBox">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EquationRow({ title, boxes, resultLabel, resultValue }) {
  return (
    <section className="equationRow">
      <h3>{title}</h3>
      <div className="equationBoxes">
        {boxes.map((box, index) => (
          <React.Fragment key={`${box.label}-${index}`}>
            <FormulaBox label={box.label} value={box.value} />
            {index < boxes.length - 1 && <b className="operator">{box.operator ?? "÷"}</b>}
          </React.Fragment>
        ))}
        <b className="operator">=</b>
        <FormulaBox label={resultLabel} value={resultValue} />
      </div>
    </section>
  );
}

function EngineeringSheet({ input, result }) {
  const sampleLeg = result.worstLeg;
  const angleFactor =
    Number.isFinite(sampleLeg.sinTheta) && sampleLeg.sinTheta !== 0
      ? 1 / sampleLeg.sinTheta
      : NaN;
  const utilization =
    Number.isFinite(result.maxTensionKg) && input.wllKg > 0
      ? (result.maxTensionKg / input.wllKg) * 100
      : NaN;

  return (
    <section className="engineeringSheet" aria-label="Lifting calculation sheet">
      <div className="sheetTop">
        <div>
          <p className="sheetKicker">LIFTING CALCULATION</p>
          <h2>4-Leg Webbing Sling Container</h2>
        </div>
        <div className="sheetPage">Page 1 / 1</div>
      </div>

      <div className="sheetBody">
        <aside className="configTable" aria-label="Configuration">
          <h3>CONFIGURATION</h3>
          <dl>
            <div>
              <dt>Hitch</dt>
              <dd>Direct hitch</dd>
            </div>
            <div>
              <dt>Hitch factor</dt>
              <dd>1.0</dd>
            </div>
            <div>
              <dt>Angle</dt>
              <dd>{fmt(sampleLeg.angleDeg, 1)} deg</dd>
            </div>
            <div>
              <dt>Angle factor</dt>
              <dd>{fmt(angleFactor, 2)}</dd>
            </div>
            <div>
              <dt>Sling type</dt>
              <dd>Webbing</dd>
            </div>
            <div>
              <dt>Sling qty</dt>
              <dd>4 leg</dd>
            </div>
            <div>
              <dt>WLL / leg</dt>
              <dd>{fmtWhole(input.wllKg)} kg</dd>
            </div>
          </dl>
        </aside>

        <div className="sheetMain">
          <EquationRow
            title="SLING TENSION CALCULATION"
            boxes={[
              { label: "TOTAL LOAD", value: `${fmtWhole(result.totalKg)} KG`, operator: "÷" },
              { label: "SLING QTY", value: "4 LEG", operator: "×" },
              { label: "ANGLE FACTOR", value: fmt(angleFactor, 2), operator: "×" },
            ]}
            resultLabel="MAX SLING TENSION"
            resultValue={`${fmtWhole(result.maxTensionKg)} KG`}
          />

          <EquationRow
            title="SAFETY FACTOR SLING"
            boxes={[
              { label: "SWL / WLL SLING", value: `${fmtWhole(input.wllKg)} KG`, operator: "÷" },
              { label: "SLING TENSION", value: `${fmtWhole(result.maxTensionKg)} KG` },
            ]}
            resultLabel="SAFETY FACTOR"
            resultValue={`${fmt(result.minMargin, 2)} X`}
          />

          <EquationRow
            title="PERCENTAGE OF USE SLING / UTILIZATION"
            boxes={[
              { label: "SLING TENSION", value: `${fmtWhole(result.maxTensionKg)} KG`, operator: "÷" },
              { label: "SWL / WLL SLING", value: `${fmtWhole(input.wllKg)} KG`, operator: "×" },
              { label: "100%", value: "100" },
            ]}
            resultLabel="UTILIZATION"
            resultValue={`${fmt(utilization, 1)}%`}
          />
        </div>
      </div>
    </section>
  );
}

function LiftingVisual({ input, result, setValue, setSlingLength }) {
  const positions = [
    "slingOneInput",
    "slingTwoInput",
    "slingThreeInput",
    "slingFourInput",
  ];

  return (
    <section className="liftingVisual" aria-label="Gambaran angkat container">
      <div className="visualHeader">
        <div>
          <h2>Gambaran Angkat Container</h2>
          <p>Hook tengah, 4-leg sling ke empat lifting point container.</p>
        </div>
        <strong>{result.passed ? "Setup Lulus" : "Semak Setup"}</strong>
      </div>

      <div className="visualStage">
        <svg viewBox="0 0 900 520" role="img" aria-label="Diagram 4-leg sling mengangkat container">
          <defs>
            <marker
              id="arrow"
              markerHeight="8"
              markerWidth="8"
              orient="auto"
              refX="7"
              refY="4"
            >
              <path d="M0,0 L8,4 L0,8 Z" />
            </marker>
          </defs>

          <path className="craneLine" d="M450 28 V78" />
          <path className="hook" d="M428 78 H472 V103 C472 128 428 128 428 103" />
          <circle className="hookPin" cx="450" cy="112" r="10" />

          <path className="slingLine" d="M450 122 L210 330" />
          <path className="slingLine" d="M450 122 L690 330" />
          <path className="slingLine rear" d="M450 122 L285 392" />
          <path className="slingLine rear" d="M450 122 L615 392" />

          <ellipse className="topFace" cx="450" cy="350" rx="285" ry="82" />
          <path className="containerTop" d="M165 330 L640 330 L735 392 L260 392 Z" />
          <path className="containerFront" d="M260 392 L735 392 L735 468 L260 468 Z" />
          <path className="containerSide" d="M165 330 L260 392 L260 468 L165 405 Z" />
          <path className="containerSide right" d="M640 330 L735 392 L735 468 L640 405 Z" />

          <path className="containerRib" d="M306 392 V468 M352 392 V468 M398 392 V468 M444 392 V468 M490 392 V468 M536 392 V468 M582 392 V468 M628 392 V468 M674 392 V468" />
          <path className="containerRib side" d="M190 346 V421 M215 362 V438 M665 346 V421 M690 362 V438" />

          <circle className="liftPoint" cx="210" cy="330" r="10" />
          <circle className="liftPoint" cx="690" cy="330" r="10" />
          <circle className="liftPoint" cx="285" cy="392" r="10" />
          <circle className="liftPoint" cx="615" cy="392" r="10" />

          <path className="dimension" d="M260 492 H735" markerEnd="url(#arrow)" />
          <path className="dimension" d="M735 492 H260" markerEnd="url(#arrow)" />
          <text className="dimensionText" x="470" y="513">L = {fmt(input.lengthM, 3)} m</text>
          <path className="dimension" d="M130 338 L228 404" markerEnd="url(#arrow)" />
          <path className="dimension" d="M228 404 L130 338" markerEnd="url(#arrow)" />
          <text className="dimensionText" x="92" y="390">d = {fmt(input.widthM, 3)} m</text>

          <text className="slingLabel" x="245" y="223">S1</text>
          <text className="slingLabel" x="625" y="223">S2</text>
          <text className="slingLabel" x="302" y="275">S3</text>
          <text className="slingLabel" x="578" y="275">S4</text>
          <text className="hookLabel" x="424" y="24">Hook</text>
          <text className="loadLabel" x="374" y="438">{fmtWhole(result.totalKg)} kg</text>
        </svg>

        <div className="visualInputs">
          <div className="visualGroup loadGroup">
            <DiagramInput label="W" suffix="kg" value={input.loadKg} onChange={setValue("loadKg")} step="1" tone="light" />
            <DiagramInput label="Wh" suffix="kg" value={input.riggingKg} onChange={setValue("riggingKg")} step="1" tone="light" />
          </div>

          {input.slingLengthsM.map((value, index) => (
            <div className={`visualGroup ${positions[index]}`} key={slingNames[index]}>
              <DiagramInput
                label={`S${index + 1}`}
                suffix="m"
                value={value}
                onChange={setSlingLength(index)}
                tone="light"
              />
            </div>
          ))}

          <div className="visualGroup containerInput">
            <DiagramInput label="L" suffix="m" value={input.lengthM} onChange={setValue("lengthM")} tone="light" />
            <DiagramInput label="D" suffix="m" value={input.widthM} onChange={setValue("widthM")} tone="light" />
            <DiagramInput label="WLL" suffix="kg" value={input.wllKg} onChange={setValue("wllKg")} step="1" tone="light" />
          </div>
        </div>
      </div>
    </section>
  );
}

function SlingCard({ leg, verticalPerLegKg, wllKg }) {
  return (
    <article className={`slingCard ${leg.passed ? "ok" : "bad"}`}>
      <div className="slingHead">
        <h3>{leg.name}</h3>
        <strong>{leg.passed ? "LULUS" : leg.geometryOk ? "TIDAK LULUS" : "SEMAK"}</strong>
      </div>
      <dl>
        <div>
          <dt>Panjang S</dt>
          <dd>{fmt(leg.slingLengthM, 3)} m</dd>
        </div>
        <div>
          <dt>Tinggi H</dt>
          <dd>{fmt(leg.heightM, 3)} m</dd>
        </div>
        <div>
          <dt>Sudut</dt>
          <dd>{fmt(leg.angleDeg, 1)} deg</dd>
        </div>
        <div>
          <dt>Beban menegak</dt>
          <dd>{fmtWhole(verticalPerLegKg)} kg</dd>
        </div>
        <div>
          <dt>Tension</dt>
          <dd>{fmtWhole(leg.tensionKg)} kg</dd>
        </div>
        <div>
          <dt>Margin WLL</dt>
          <dd>{fmt(wllKg / leg.tensionKg, 2)} kali</dd>
        </div>
      </dl>
    </article>
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
  const sampleLeg = result.worstLeg;

  const setValue = (key) => (value) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const setSlingLength = (index) => (value) => {
    setInput((current) => {
      const slingLengthsM = [...current.slingLengthsM];
      slingLengthsM[index] = value;
      return { ...current, slingLengthsM };
    });
  };

  const warning =
    !result.allGeometryOk &&
    "Ada sling yang terlalu pendek untuk jarak mendatar ini. Naikkan panjang sling atau kecilkan jarak lifting point.";

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Bahasa Melayu | kg dan meter</p>
          <h1>4 Slings Tension</h1>
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
            {input.slingLengthsM.map((value, index) => (
              <Field
                key={slingNames[index]}
                icon={Ruler}
                label={`${slingNames[index]} panjang, S${index + 1}`}
                suffix="m"
                value={value}
                onChange={setSlingLength(index)}
              />
            ))}
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
              <span>Status semua sling</span>
              <strong>
                {result.passed ? "SEMUA LULUS" : result.allGeometryOk ? "ADA TIDAK LULUS" : "SEMAK INPUT"}
              </strong>
            </div>
          </div>

          {warning && <p className="warning">{warning}</p>}

          <LiftingVisual
            input={input}
            result={result}
            setValue={setValue}
            setSlingLength={setSlingLength}
          />

          <EngineeringSheet
            input={input}
            result={result}
          />

          <div className="summary">
            <ResultPill label="Jumlah berat" value={`${fmtWhole(result.totalKg)} kg`} />
            <ResultPill label="Jarak mendatar" value={`${fmt(result.horizontalM, 3)} m`} />
            <ResultPill label="Beban / sling" value={`${fmtWhole(result.verticalPerLegKg)} kg`} />
            <ResultPill label="Tension tertinggi" value={`${fmtWhole(result.maxTensionKg)} kg`} />
            <ResultPill label="Sling paling berat" value={sampleLeg.name} />
            <ResultPill label="Margin terendah" value={`${fmt(result.minMargin, 2)} kali`} />
          </div>

          <section className="slingGrid" aria-label="Result setiap sling">
            {result.legs.map((leg) => (
              <SlingCard
                key={leg.name}
                leg={leg}
                verticalPerLegKg={result.verticalPerLegKg}
                wllKg={input.wllKg}
              />
            ))}
          </section>

          <section className="report">
            <div className="reportTitle">
              <h2>Jalan Kiraan Lengkap</h2>
              <p>Contoh detail ikut sling paling tinggi tension: {sampleLeg.name}.</p>
            </div>

            <Step number="1" title="Kira jumlah berat" formula="Jumlah Berat = Berat Beban + Berat Rigging">
              <p>Jumlah Berat = {fmtWhole(input.loadKg)} + {fmtWhole(input.riggingKg)}</p>
              <p>{fmtWhole(input.loadKg)} + {fmtWhole(input.riggingKg)} = {fmtWhole(result.totalKg)} kg</p>
              <p>Dalam tan: {fmtWhole(result.totalKg)} / 1,000 = {fmt(result.totalKg / 1000, 2)} tan</p>
            </Step>

            <Step number="2" title="Kira jarak mendatar 3D setiap sling" formula="R = sqrt(L^2 + d^2)">
              <p>R = sqrt({fmt(input.lengthM, 3)}^2 + {fmt(input.widthM, 3)}^2)</p>
              <p>{fmt(input.lengthM, 3)}^2 = {fmt(input.lengthM ** 2, 3)}</p>
              <p>{fmt(input.widthM, 3)}^2 = {fmt(input.widthM ** 2, 3)}</p>
              <p>{fmt(input.lengthM ** 2, 3)} + {fmt(input.widthM ** 2, 3)} = {fmt(input.lengthM ** 2 + input.widthM ** 2, 3)}</p>
              <p>sqrt({fmt(input.lengthM ** 2 + input.widthM ** 2, 3)}) = {fmt(result.horizontalM, 3)} m</p>
            </Step>

            <Step number="3" title={`Kira tinggi ${sampleLeg.name}`} formula="H = sqrt(S^2 - R^2)">
              <p>H = sqrt({fmt(sampleLeg.slingLengthM, 3)}^2 - {fmt(result.horizontalM, 3)}^2)</p>
              <p>{fmt(sampleLeg.slingLengthM, 3)}^2 = {fmt(sampleLeg.slingLengthM ** 2, 3)}</p>
              <p>{fmt(result.horizontalM, 3)}^2 = {fmt(result.horizontalM ** 2, 3)}</p>
              <p>{fmt(sampleLeg.slingLengthM ** 2, 3)} - {fmt(result.horizontalM ** 2, 3)} = {fmt(sampleLeg.heightSquared, 3)}</p>
              <p>sqrt({fmt(sampleLeg.heightSquared, 3)}) = {fmt(sampleLeg.heightM, 3)} m</p>
            </Step>

            <Step number="4" title={`Kira sudut ${sampleLeg.name} dari horizontal`} formula="theta = sin^-1(H / S)">
              <p>theta = sin^-1({fmt(sampleLeg.heightM, 3)} / {fmt(sampleLeg.slingLengthM, 3)})</p>
              <p>{fmt(sampleLeg.heightM, 3)} / {fmt(sampleLeg.slingLengthM, 3)} = {fmt(sampleLeg.sinAngle, 4)}</p>
              <p>sin^-1({fmt(sampleLeg.sinAngle, 4)}) = {fmt(sampleLeg.angleDeg, 2)} deg</p>
              <p className="note">Pastikan scientific calculator berada dalam mode DEG, bukan RAD.</p>
            </Step>

            <Step number="5" title="Kira beban menegak setiap sling" formula="Beban Setiap Sling = Jumlah Berat / 4">
              <p>Beban setiap sling = {fmtWhole(result.totalKg)} / 4</p>
              <p>{fmtWhole(result.totalKg)} / 4 = {fmtWhole(result.verticalPerLegKg)} kg</p>
            </Step>

            <Step number="6" title={`Kira tension sebenar ${sampleLeg.name}`} formula="Tension = Beban Setiap Sling / sin(theta)">
              <p>Tension = {fmtWhole(result.verticalPerLegKg)} / sin({fmt(sampleLeg.angleDeg, 2)})</p>
              <p>sin({fmt(sampleLeg.angleDeg, 2)}) = {fmt(sampleLeg.sinTheta, 4)}</p>
              <p>{fmtWhole(result.verticalPerLegKg)} / {fmt(sampleLeg.sinTheta, 4)} = {fmtWhole(sampleLeg.tensionKg)} kg</p>
              <p>Dalam tan: {fmtWhole(sampleLeg.tensionKg)} / 1,000 = {fmt(sampleLeg.tensionKg / 1000, 2)} tan</p>
            </Step>

            <Step number="7" title="Result Sling 1, Sling 2, Sling 3, Sling 4" formula="Kiraan yang sama dibuat untuk setiap sling">
              {result.legs.map((leg) => (
                <p key={leg.name}>
                  {leg.name}: S = {fmt(leg.slingLengthM, 3)} m, H = {fmt(leg.heightM, 3)} m, sudut = {fmt(leg.angleDeg, 2)} deg,
                  tension = {fmtWhole(leg.tensionKg)} kg, status = {leg.passed ? "LULUS" : leg.geometryOk ? "TIDAK LULUS" : "SEMAK"}
                </p>
              ))}
            </Step>

            <Step number="8" title="Semak WLL sling" formula="WLL Sling >= Tension Sebenar">
              <p>WLL sling = {fmtWhole(input.wllKg)} kg</p>
              <p>Tension tertinggi = {fmtWhole(result.maxTensionKg)} kg ({sampleLeg.name})</p>
              <p>{fmtWhole(input.wllKg)} {result.passed ? ">=" : "<"} {fmtWhole(result.maxTensionKg)}</p>
              <p>Status keseluruhan: {result.passed ? "LULUS" : "TIDAK LULUS"}</p>
            </Step>

            <Step number="9" title="Kira margin keselamatan paling rendah" formula="Margin = WLL Sling / Tension Sebenar">
              <p>Margin = {fmtWhole(input.wllKg)} / {fmtWhole(result.maxTensionKg)}</p>
              <p>{fmtWhole(input.wllKg)} / {fmtWhole(result.maxTensionKg)} = {fmt(result.minMargin, 2)} kali</p>
            </Step>
          </section>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
