import test from 'node:test';
import assert from 'node:assert/strict';
import { groundResult, KPA_PER_TF_M2, pressureKpa } from '../src/ground.js';
import { calc, calcKnownAngle, defaults } from '../src/rigging.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const base={load:400,loadUnit:'kN',area:2,capacity:250,capacityUnit:'kPa',peak:'',peakUnit:'kPa'};
test('400 kN over 2 m² = 200 kPa and 80%; peak remains unknown',()=>{
 const r=groundResult(base);close(r.averageKpa,200);close(r.averageUtilization,80);assert.equal(r.peakKpa,null);assert.equal(r.peakUtilization,null);
});
test('tonne-force and pressure conversions; independent peak utilization',()=>{
 const r=groundResult({...base,load:40,loadUnit:'tf',area:4,capacity:20,capacityUnit:'tf/m²',peak:25,peakUnit:'tf/m²'});
 close(r.averageKpa,98.0665);close(r.averageUtilization,50);close(r.peakUtilization,125);close(pressureKpa(1,'tf/m²'),KPA_PER_TF_M2);
});
test('unequal tracks are calculated independently without redistribution',()=>{
 close(groundResult({...base,load:1800,area:12}).averageKpa,150);
 close(groundResult({...base,load:900,area:10}).averageKpa,90);
});
test('invalid, empty, zero, negative and overflowing inputs never produce utilization',()=>{
 for(const value of ['', ' ',0,-1,NaN,Infinity,'abc']){
  assert.equal(groundResult({...base,load:value}).averageKpa,null);
  assert.equal(groundResult({...base,area:value}).averageUtilization,null);
  assert.equal(groundResult({...base,capacity:value}).averageUtilization,null);
  assert.equal(groundResult({...base,peak:value}).peakKpa,null);
 }
 assert.equal(groundResult({...base,load:1e308,loadUnit:'tf'}).averageKpa,null);
 assert.equal(groundResult({...base,area:1e-320}).averageKpa,null);
 assert.equal(pressureKpa(5,'bad'),null);
});
test('inconsistent maximum flagged; threshold is unrounded',()=>{
 assert.equal(groundResult({...base,peak:199}).inconsistent,true);
 assert.equal(groundResult({...base,peak:200}).inconsistent,false);
 assert.ok(groundResult({...base,load:500.001}).averageUtilization>100);
});
test('existing sling calculation regression across all hitch options',()=>{
 for(const [hitchType,factor] of [['direct',1],['choke',.8],['basket',2]]){
 const r=calc({...defaults,hitchType});close(r.totalKg,8000);close(r.verticalPerLegKg,2000);close(r.maxTensionKg,2000*Math.sqrt(2));close(r.effectiveWllKg,3250*factor);assert.equal(r.passed,hitchType!=='choke');
 }
});
test('existing angle and invalid geometry regression',()=>{
 const r=calcKnownAngle(defaults);close(r.slingLegM,.6);close(r.headRoomM,Math.sqrt(.18));
 assert.equal(calc({...defaults,slingLengthsM:[.1,.6,.6,.6]}).allGeometryOk,false);
});
