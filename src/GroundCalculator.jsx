import React, { useState } from 'react';
import { groundResult, KPA_PER_TF_M2 } from './ground.js';
import './ground.css';
const empty = () => ({load:'', area:'', peak:''});
const display = value => value === null ? '—' : value.toLocaleString('ms-MY', {maximumFractionDigits:2});
function NumberField({label, value, onChange, unit}) {
  return <label className="gb-field"><span>{label} ({unit})</span><input type="number" min="0" step="any" inputMode="decimal" value={value} onChange={e=>onChange(e.target.value)} /></label>;
}
function Unit({label, value, values, onChange}) {
  return <label className="gb-field"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{values.map(v=><option key={v}>{v}</option>)}</select></label>;
}
export default function GroundCalculator() {
  const [mode,setMode]=useState('mobile');
  const [rows,setRows]=useState({mobile:Array.from({length:4},empty), crawler:Array.from({length:2},empty)});
  const [loadUnit,setLoadUnit]=useState('kN');
  const [capacityUnit,setCapacityUnit]=useState('kPa');
  const [peakUnit,setPeakUnit]=useState('kPa');
  const [capacity,setCapacity]=useState('');
  const [reference,setReference]=useState('');
  const update=(i,key,value)=>setRows(old=>({...old,[mode]:old[mode].map((r,j)=>j===i?{...r,[key]:value}:r)}));
  const reset=()=>{setRows({mobile:Array.from({length:4},empty),crawler:Array.from({length:2},empty)});setCapacity('');setReference('');};
  return <section className="gb" aria-labelledby="ground-title">
    <p className="gb-kicker">GROUND ENGINEERING / 01</p><h2 id="ground-title">Tekanan Tanah Kren</h2>
    <p>Masukkan beban sokongan yang disahkan. Modul ini tidak mengira reaction daripada berat keseluruhan kren.</p>
    <div className="gb-tabs" aria-label="Jenis kren">{[['mobile','Mobile • Outrigger'],['crawler','Crawler • Track']].map(([id,label])=><button type="button" key={id} aria-pressed={mode===id} onClick={()=>setMode(id)}>{label}</button>)}</div>
    <div className="gb-notice"><strong>Kiraan perbandingan sahaja — bukan pengesahan keselamatan.</strong><p>Jangan bahagi beban sama rata kepada 4 outrigger atau 2 track. Reaction dan taburan tekanan berubah mengikut radius, slew, boom/jib, counterweight, beban, kedudukan sokongan dan keadaan operasi. Semak seluruh laluan lift termasuk erection, travel dan boom down jika berkaitan.</p></div>
    <div className="gb-grid">
      <Unit label="Unit beban sokongan" value={loadUnit} values={['kN','tf']} onChange={v=>{setLoadUnit(v);setRows(old=>Object.fromEntries(Object.entries(old).map(([k,rs])=>[k,rs.map(r=>({...r,load:''}))])));}} />
      <Unit label="Unit kapasiti galas dibenarkan" value={capacityUnit} values={['kPa','tf/m²']} onChange={v=>{setCapacityUnit(v);setCapacity('');}} />
      <NumberField label="Kapasiti tanah dibenarkan, q allowable" unit={capacityUnit} value={capacity} onChange={setCapacity} />
      <Unit label="Unit tekanan maksimum disahkan" value={peakUnit} values={['kPa','tf/m²']} onChange={v=>{setPeakUnit(v);setRows(old=>Object.fromEntries(Object.entries(old).map(([k,rs])=>[k,rs.map(r=>({...r,peak:''}))])));}} />
    </div>
    <label className="gb-field"><span>Rujukan data / konfigurasi lifting / laporan geoteknik</span><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Model, boom, radius, slew, dokumen dan revisi" /></label>
    <p className="gb-small">tf = tonne-force (daya), bukan unit jisim. 1 tf = 9.80665 kN; 1 tf/m² ≈ 1 t/m² pada graviti piawai. Tukar unit akan kosongkan input berkaitan untuk mengelakkan salah tafsir.</p>
    <figure className="gb-diagram"><svg viewBox="0 0 600 210" role="img" aria-label="Skema: beban sokongan R melalui luas sentuhan efektif A; taburan sebenar tidak seragam dan puncak tidak boleh diperoleh daripada purata">
      <g fill="none" stroke="currentColor" strokeWidth="2"><path d="M100 20V80m-8-12 8 12 8-12M50 85h100v20H50zM25 115h150M40 130v50m35-50v35m35-35v60m35-60v40M240 180h330M250 175V110L320 85 400 120 470 45 550 100V175"/><path strokeDasharray="5 5" d="M240 125h330"/></g>
      <g fill="currentColor" fontSize="15" fontFamily="monospace"><text x="115" y="45">R ↓</text><text x="60" y="103">A efektif</text><text x="25" y="207">TANAH / GROUND</text><text x="280" y="25">Taburan ilustrasi sahaja</text><text x="475" y="65">puncak</text><text x="255" y="145">purata (R/A)</text></g>
    </svg><figcaption>{mode==='mobile'?'Satu outrigger → mat → tanah.':'Satu track → mat / tanah. Setiap track mempunyai input sendiri.'} Rajah bukan ramalan taburan tekanan.</figcaption></figure>
    <div className="gb-cards">{rows[mode].map((row,i)=>{
      const r=groundResult({...row,loadUnit,capacity,capacityUnit,peakUnit});
      return <article className="gb-card" key={`${mode}-${i}`}><h3>{mode==='mobile'?`Outrigger ${i+1}`:`Track ${i===0?'kiri':'kanan'}`}</h3>
        <NumberField label={mode==='mobile'?'Reaction load disahkan, R':'Track bearing load disahkan, R'} unit={loadUnit} value={row.load} onChange={v=>update(i,'load',v)} />
        <NumberField label="Luas sentuhan efektif, A" unit="m²" value={row.area} onChange={v=>update(i,'area',v)} />
        <NumberField label="Tekanan maksimum disahkan (pilihan)" unit={peakUnit} value={row.peak} onChange={v=>update(i,'peak',v)} />
        <dl><div><dt>Tekanan purata • R / A</dt><dd>{display(r.averageKpa)} kPa</dd><dd>{display(r.averageKpa===null?null:r.averageKpa/KPA_PER_TF_M2)} tf/m²</dd></div><div><dt>Utilization purata</dt><dd>{display(r.averageUtilization)}%</dd></div><div><dt>Tekanan maksimum • input disahkan</dt><dd>{display(r.peakKpa)} kPa</dd></div><div><dt>Utilization maksimum</dt><dd>{display(r.peakUtilization)}%</dd></div></dl>
        {(r.averageUtilization>100 || r.peakUtilization>100)&&<p className="gb-alert" role="status">Melebihi kapasiti galas tanah yang dimasukkan.</p>}
        {r.inconsistent&&<p className="gb-alert" role="status">Semak data: maksimum lebih rendah daripada purata. Pastikan konfigurasi dan permukaan rujukan sama.</p>}
        <p className="gb-small">{r.peakKpa===null?'Tekanan maksimum belum diketahui. R/A tidak menentukan puncak tekanan semasa lifting.':'Nilai maksimum ialah input pengguna; aplikasi tidak mengesahkan sumber atau konfigurasi.'} Nilai ≤100% juga memerlukan semakan orang kompeten.</p>
        {Object.values(row).some(v=>v!=='' && !(Number.isFinite(Number(v))&&Number(v)>0))&&<p className="gb-alert">Input mesti nombor terhingga lebih besar daripada sifar.</p>}
      </article>;
    })}</div>
    <div className="gb-notice"><h3>Formula & had penggunaan</h3><p><code>q purata (kPa) = R (kN) / A efektif (m²)</code></p><p><code>Utilization (%) = q / q allowable × 100</code></p><p>Utilization purata dan maksimum dikira berasingan. Tiada faktor automatik untuk menukar purata kepada maksimum. Input maksimum mesti merujuk konfigurasi dan permukaan sentuhan yang sama.</p><p>Luas efektif perlu disahkan oleh jurutera: jangan terus guna luas penuh steel mat atau panjang penuh track. Semak kekakuan mat, lenturan, sentuhan sebenar dan penyebaran beban. Untuk crawler, tekanan boleh tertumpu pada hujung track; beban kiri dan kanan juga boleh berbeza.</p><p>Sebelum digunakan dalam lifting plan: perlukan reaction / pressure daripada pengeluar atau analisis jurutera bagi konfigurasi sebenar, laporan geoteknik dengan kapasiti <strong>dibenarkan</strong> (bukan ultimate), serta semakan settlement, cerun, excavation, void / utiliti bawah tanah dan reka bentuk mat oleh orang kompeten. Modul ini tidak menentukan kestabilan kren atau kapasiti struktur mat.</p><p>Rujukan: <a href="https://www.liebherr.com/en-ae/mobile-and-crawler-cranes/customer-magazine/background/underground-for-safe-crane-jobs-4805645" target="_blank" rel="noreferrer">Liebherr — Underground for safe crane jobs</a>.</p></div>
    <button className="gb-reset" type="button" onClick={reset}>Kosongkan semua input tanah</button>
  </section>;
}
