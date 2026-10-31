import {reference} from '../lib/reference-snapshot.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {guides} from '../lib/guides.ts';
test('all 3149 reference records have unique IDs and primary sources',()=>{assert.equal(reference.entries.length,3149);assert.equal(new Set(reference.entries.map(e=>e.id)).size,3149);for(const e of reference.entries){assert(e.references.length,e.id);assert(e.references.some(r=>/^https:\/\/(?:[^/]+\.)?(?:w3\.org|whatwg\.org|csswg\.org|mozilla\.org|github\.com|raw\.githubusercontent\.com|w3c\.github\.io|wicg\.github\.io|immersive-web\.github\.io)/.test(r.url)),e.id);if(!e.description)assert(e.descriptionUnavailable,e.id);}});
test('published coverage counts match the actual dataset',()=>{for(const[k,v]of Object.entries(reference.coverage.counts))assert.equal(reference.entries.filter(e=>e.kind===k).length,v,k);assert.equal(reference.entries.filter(e=>e.description).length,reference.coverage.descriptions);assert.equal(reference.entries.filter(e=>!e.description).length,reference.coverage.withoutDescription);});
test('source commits predate or equal the requested cutoff',()=>{const pins=JSON.parse(fs.readFileSync('public/sources/pins.json','utf8'));for(const p of Object.values(pins) as any[]){assert(new Date(p.date)<=new Date('2026-10-29T23:59:59Z'));assert.match(p.sha,/^[0-9a-f]{40}$/)}});
test('worked guides contain implementation steps, full examples, caveats, and primary sources',()=>{assert(guides.length>=25);for(const g of guides){assert(g.meaning.length>150,g.id);assert(g.where.length>50,g.id);assert(g.steps.length>=5,g.id);assert(g.pitfalls.length>=2,g.id);assert(g.html&&g.css,g.id);assert(g.sources.length,g.id);}});
