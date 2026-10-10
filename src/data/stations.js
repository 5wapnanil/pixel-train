/**
 * The route is deliberately kept in its own file so it is easy to edit.
 *
 * `travelSeconds` controls how long the train travels before moving to the
 * next station automatically. Add another station object to extend the line.
 */
export const stations = [
  {
    id: 'kamalapur',
    name: 'KAMALAPUR',
    region: 'DHAKA',
    code: 'DHK',
    travelSeconds: 24,
  },
  {
    id: 'sylhet',
    name: 'SYLHET',
    region: 'SYLHET DIVISION',
    code: 'SYL',
    travelSeconds: 24,
  },
];
