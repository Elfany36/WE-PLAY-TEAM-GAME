import type {ReferenceData} from './reference-types.ts';
import {additionalUnitEntries} from './reference-units.ts';

// Keep pinned upstream files intact. These authored corrections apply equally
// to the reader and scored questions; provenance is in editorial-corrections.json.
export function correctedReference(data:ReferenceData):ReferenceData {
 const corrections:Record<string,{description:string;url:string}>={
  'css-at-rule-charset':{description:'The @charset encoding declaration specifies how a CSS stylesheet’s input bytes should be decoded. It does not set the HTML document encoding. When present, it must use the exact encoding-declaration syntax at the start of the stylesheet, after an optional byte-order mark. CSS Syntax consumes it while decoding bytes; there is no parsed @charset at-rule in the CSS rule tree. Prefer UTF-8 files and appropriate HTTP encoding metadata.',url:'https://www.w3.org/TR/2026/CRD-css-syntax-3-20261001/#input-byte-stream'},
  'css-at-rule-media':{description:'The @media conditional group rule applies its enclosed style rules when its media query list matches. Queries can test media types and media features such as viewport width or user preferences. Use it for responsive layouts and preference-aware styling; it does not itself resize content or detect a particular device model.',url:'https://www.w3.org/TR/2024/CRD-css-conditional-3-20240815/#at-ruledef-media'},
  'css-at-rule-property':{description:'The @property rule registers a custom property with a value syntax, inheritance behavior and, where required, an initial value. Registration enables typed validation and interpolation. A 2026 editor draft extends registration grammar beyond the 2024 published draft; the basic compatibility record does not establish support for every draft extension. For broadly implemented examples, register one custom-property name and provide syntax, inherits and a computationally independent initial-value.',url:'https://www.w3.org/TR/2024/WD-css-properties-values-api-1-20240326/#at-property-rule'},
 };
 const combined=[...data.entries,...additionalUnitEntries(data.entries)];const entries=combined.map(e=>corrections[e.id]?{...e,description:corrections[e.id].description,references:[{name:'Primary specification · authored correction',url:corrections[e.id].url},...e.references]}:e.id==='css-pseudo-class-not'?{
  ...e,
  description:'The :not() CSS pseudo-class matches an element only when it matches none of the selectors in its argument. Selectors Level 4 accepts a comma-separated list of complex selectors. Pseudo-elements are not valid arguments. Its specificity is the highest specificity among its argument selectors. The compatibility table records the basic pseudo-class; selector-list arguments require later browser versions.',
  syntax:':not( <complex-real-selector-list> )',
  references:[{name:'Selectors Level 4 · authored correction',url:'https://www.w3.org/TR/2026/WD-selectors-4-20260122/#negation'},...e.references],
 }:e);const counts=Object.fromEntries(Object.keys(data.coverage.counts).map(kind=>[kind,entries.filter(e=>e.kind===kind).length]));return {...data,entries,coverage:{...data.coverage,counts,total:entries.length,descriptions:entries.filter(e=>e.description).length,withoutDescription:entries.filter(e=>!e.description).length}};
}
