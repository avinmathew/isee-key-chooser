// // https://www.inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies

// const wls = [
//   {name: 'Esther', low: 52, high: 74}, // E3 to D5
// ];
// const songs = [
//   {name: 'Blessed Be The Lord - Planetshakers', key: 'Eb', low: 58, high: 70}, // Bb3 to Bb4
//   {name: 'I Speak Jesus - Charity Gayle',       key: 'E',  low: 52, high: 73}, // E3 to C#5
//   {name: 'It Is Done - Planetshakers',          key: 'C',  low: 55, high: 67}, // G3 to G4
//   {name: 'Praise On It - Planetshakers',        key: 'E',  low: 52, high: 69}, // E3 to A4
//   {name: 'We Lift Up Jesus - Planetshakers',    key: 'F',  low: 53, high: 67}, // F3 to G4
//   {name: 'Victory of Jesus - Planetshakers',    key: 'E',  low: 52, high: 68}, // E3 to G#4
//   {name: 'We Raise - Planetshakers',            key: 'A',  low: 55, high: 69}, // G3 to A4
//   {name: 'Worthy Is The Lamb - Planetshakers',  key: 'D',  low: 57, high: 69}  // A3 to A4
// ];

const id = '15sEuDqyqvvCVB2zs9A3BMhb4XtDvSM-BwZTJpRnNJVo';
const wlGid = '1505942994';
const songGid = '600972592';
const wlSpreadsheetUrl = 'https://docs.google.com/spreadsheets/d/'+id+'/gviz/tq?tqx=out:json&tq&gid='+wlGid;
const songSpreadsheetUrl = 'https://docs.google.com/spreadsheets/d/'+id+'/gviz/tq?tqx=out:json&tq&gid='+songGid;

let wls;
let songs;
fetch(wlSpreadsheetUrl)
  .then(response => {
    if (response.ok) {
      response.text().then(data => {
        data = data.substring(47).slice(0, -2);
        data = JSON.parse(data);
        // Transform Google Sheets data structure
        const rows = data.table.rows.map(row => {
          return {
            name: row.c[0].v,
            low: row.c[1].v,
            high: row.c[2].v
          }
        });
        wls = rows;
      });
    } else {
      console.error('Could not read WL Range sheet');
    }
  })
  .then(() => {
    fetch(songSpreadsheetUrl)
    .then(response => {
      if (response.ok) {
        response.text().then(data => {
          data = data.substring(47).slice(0, -2);
          data = JSON.parse(data);
          // Transform Google Sheets data structure
          const rows = data.table.rows.map(row => {
            return {
              name: `${row.c[0].v} - ${row.c[1].v}`,
              key: row.c[2].v,
              low: row.c[3].v,
              high: row.c[4].v
            }
          });
          songs = rows;
          init();
        });
      } else {
        console.error('Could not read Song Range sheet');
      }
    })
  });