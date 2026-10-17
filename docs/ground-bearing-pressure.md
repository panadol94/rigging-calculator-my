# Ground bearing pressure module

Run `npm ci`, `npm test`, `npm run build`.

The ground calculator has independent records for four outriggers and two crawler tracks. It does not derive reactions from crane or lifted mass. Inputs start empty, and unit changes clear the associated quantities instead of relabelling values. Reference notes are session-only and are not stored or verified.

Average pressure: q = R / A effective. kN/m² = kPa. 1 tonne-force = 9.80665 kN; tf/m² corresponds numerically to the customary t/m² pressure shorthand at standard gravity. Utilization = pressure / allowable ground bearing capacity × 100. No ultimate-to-allowable conversion or automatic load distribution is performed.

Maximum pressure is a separate supplied value, not inferred from average or a generic peak factor. It must represent the same interface, configuration and applicable operating condition as the supporting data. A maximum reaction divided by effective area remains an average contact pressure for that reaction; it does not establish local peak pressure. Missing peak data remains unknown. A supplied peak below average is flagged for review. A result below 100% is not an approval.

Engineer confirmation is required for effective contact and mat load spreading/strength. Manufacturer or engineered configuration data and geotechnical allowable bearing capacity are required before use in a lifting plan. Review settlements, buried structures/services, voids, excavations and slopes. Check the full lifting path and applicable erection/travel/boom-down states. This module does not assess crane stability.

Manufacturer background: https://www.liebherr.com/en-ae/mobile-and-crawler-cranes/customer-magazine/background/underground-for-safe-crane-jobs-4805645

The existing rigging arithmetic was moved unchanged into `src/rigging.js` for regression tests. Its four-leg equal-share assumption and generic hitch factors remain limited assumptions; an explanatory notice has been added. This work does not validate that model for an actual rigging arrangement.

Validation: seven Node test cases cover known average pressures, conversions, independent track loading, missing/invalid/extreme input, peak consistency, unrounded exceedance checks, and existing sling/angle/hitch calculations. Vite production build passes. Browser layout verification could not run in this environment because the Playwright Chromium binary is unavailable; phone layout should be checked during review.
