const slingNames = ["Sling 1", "Sling 2", "Sling 3", "Sling 4"];

const hitchOptions = [
  {
    id: "direct",
    label: "Direct hitch",
    shortLabel: "Direct",
    factor: 1,
  },
  {
    id: "choke",
    label: "Choke hitch",
    shortLabel: "Choke",
    factor: 0.8,
  },
  {
    id: "basket",
    label: "Basket hitch",
    shortLabel: "Basket",
    factor: 2,
  },
];

const defaults = {
  loadKg: 6000,
  riggingKg: 2000,
  slingLengthsM: [0.6, 0.6, 0.6, 0.6],
  lengthM: 0.3,
  widthM: 0.3,
  knownAngleDeg: 45,
  wllKg: 3250,
  hitchType: "direct",
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

function fmtCompact(value, digits = 3) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("ms-MY", {
    maximumFractionDigits: digits,
  }).format(value);
}

function metersToImperial(value) {
  if (!Number.isFinite(value)) {
    return {
      feet: "-",
      inches: "-",
      totalInches: "-",
    };
  }

  const totalInchesValue = value / 0.0254;
  const feetValue = Math.floor(totalInchesValue / 12);
  const inchesValue = totalInchesValue - feetValue * 12;

  return {
    feet: fmtWhole(feetValue),
    inches: fmt(inchesValue, 2),
    totalInches: fmt(totalInchesValue, 2),
  };
}

function calcKnownAngle(input) {
  const angleRad = (input.knownAngleDeg * Math.PI) / 180;
  const horizontalM = Math.sqrt(input.lengthM ** 2 + input.widthM ** 2);
  const cosAngle = Math.cos(angleRad);
  const tanAngle = Math.tan(angleRad);
  const slingLegM = cosAngle > 0 ? horizontalM / cosAngle : NaN;
  const headRoomM = tanAngle > 0 ? horizontalM * tanAngle : NaN;

  return {
    horizontalM,
    slingLegM,
    headRoomM,
    angleOk: input.knownAngleDeg >= 30 && input.knownAngleDeg < 90,
    slingLegImperial: metersToImperial(slingLegM),
    headRoomImperial: metersToImperial(headRoomM),
  };
}

function calcLeg(name, slingLengthM, horizontalM, verticalPerLegKg, effectiveWllKg) {
  const heightSquared = slingLengthM ** 2 - horizontalM ** 2;
  const heightM = heightSquared >= 0 ? Math.sqrt(heightSquared) : NaN;
  const sinAngle = heightM / slingLengthM;
  const angleDeg =
    Number.isFinite(sinAngle) && sinAngle >= -1 && sinAngle <= 1
      ? (Math.asin(sinAngle) * 180) / Math.PI
      : NaN;
  const sinTheta = Math.sin((angleDeg * Math.PI) / 180);
  const angleFactor = 1 / sinTheta;
  const tensionKg = verticalPerLegKg * angleFactor;
  const margin = effectiveWllKg / tensionKg;
  const geometryOk = heightSquared >= 0 && slingLengthM > 0;

  return {
    name,
    slingLengthM,
    heightSquared,
    heightM,
    sinAngle,
    angleDeg,
    sinTheta,
    angleFactor,
    tensionKg,
    margin,
    geometryOk,
    passed: geometryOk && Number.isFinite(tensionKg) && effectiveWllKg >= tensionKg,
  };
}

function calc(input) {
  const hitch = hitchOptions.find((option) => option.id === input.hitchType) ?? hitchOptions[0];
  const totalKg = input.loadKg + input.riggingKg;
  const horizontalM = Math.sqrt(input.lengthM ** 2 + input.widthM ** 2);
  const verticalPerLegKg = totalKg / 4;
  const effectiveWllKg = input.wllKg * hitch.factor;
  const legs = input.slingLengthsM.map((length, index) =>
    calcLeg(slingNames[index], length, horizontalM, verticalPerLegKg, effectiveWllKg),
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
    hitch,
    effectiveWllKg,
    legs,
    worstLeg,
    maxTensionKg,
    minMargin,
    allGeometryOk,
    passed,
  };
}


export { defaults, calc, calcKnownAngle, num, fmt, fmtWhole, fmtCompact, slingNames, hitchOptions };
