/**
 * Representative photographs for the demonstration inventory.
 *
 * Every entry names a file on Wikimedia Commons. `npm run photos` downloads it,
 * reads the author / licence / source straight from the Commons API (credits are
 * never typed by hand), blurs registration plates, crops to 3:2 and writes WebP
 * to public/photos/ plus src/lib/demo/photos.generated.json.
 *
 * Each photo was checked by eye to show the same make, model and generation as
 * its demonstration listing; listing colours/trims were adjusted to match.
 *
 * blur:  plate rectangles as fractions of the SOURCE image [x, y, w, h].
 * car:   horizontal extent of the vehicle [x0, x1]; framing never cuts inside it.
 * focusY: vertical centre of the crop for sources taller than the target frame.
 */
export const VEHICLE_PHOTOS = [
  { n: 1, file: "2019 Porsche 911 Carrera S S-A 3.0 Front.jpg", alt: "Silver Porsche 911 Carrera S (992 generation), front three-quarter view", blur: [[.07, .615, .115, .135], [0, .205, .035, .07]], car: [.04, .96] },
  { n: 2, file: "Ferrari F8 Tribut.jpg", alt: "Red Ferrari F8 Tributo on a display stand, front three-quarter view" },
  { n: 3, file: "Lamborghini Huracan Evo, GIMS 2019, Le Grand-Saconnex (GIMS1010).jpg", alt: "Orange Lamborghini Huracán EVO at the Geneva motor show, front three-quarter view", car: [.01, .99] },
  { n: 4, file: "2018 McLaren 720S in Azores Orange, front right.jpg", alt: "Azores Orange McLaren 720S, front three-quarter view", car: [.02, .98] },
  { n: 5, file: "2022 Rolls-Royce Ghost front.jpg", alt: "Silver second-generation Rolls-Royce Ghost, front three-quarter view", blur: [[.912, .495, .075, .065]], car: [.1, .99] },
  { n: 6, file: "Bentley Continental GT (51430537663).jpg", alt: "Black third-generation Bentley Continental GT parked on a city street, front view", blur: [[.56, .77, .27, .09]] },
  { n: 7, file: "0 Mercedes-Benz W223 3.jpg", alt: "Black Mercedes-Benz S-Class (W223) saloon, front three-quarter view", blur: [[.79, .695, .15, .115]], car: [0, .99] },
  { n: 8, file: "2018 Aston Martin DB11 V8 Automatic 4.0 Front.jpg", alt: "Silver Aston Martin DB11 V8, front three-quarter view", blur: [[.83, .645, .115, .105]], car: [.03, .98] },
  { n: 9, file: "2021 BMW M3 Competition Automatic 3.0 Front.jpg", alt: "Grey BMW M3 Competition (G80) saloon, front three-quarter view", blur: [[.755, .655, .145, .11]], car: [.03, .97] },
  { n: 10, file: "2021 Audi RS6 Avant in Nardo Grey, Front Right, 09-04-2022.jpg", alt: "Nardo Grey Audi RS 6 Avant (C8), front three-quarter view", blur: [[.675, .6, .125, .135]], focusY: .5 },
  { n: 11, file: "2019 Tesla Model 3 Performance AWD Front.jpg", alt: "White Tesla Model 3, front three-quarter view", blur: [[.055, .61, .125, .11]], car: [.02, .97] },
  { n: 12, file: "2020 Tesla Model Y (United States) front view NHTSA.jpg", alt: "Grey Tesla Model Y, front three-quarter view", blur: [[.8, .585, .08, .06]] },
  { n: 13, file: "BYD Seal 004.jpg", alt: "Light blue BYD Seal electric saloon, front three-quarter view", blur: [[.155, .61, .18, .13]], focusY: .475 },
  { n: 14, file: "2021 Toyota Land Cruiser 300 (Russia) front view.jpg", alt: "White Toyota Land Cruiser 300 in a showroom, front three-quarter view", blur: [[.055, .68, .07, .07]], car: [.05, .98] },
  { n: 15, file: "Toyota Corolla Hatch (Front) in Cape Town CBD.jpg", alt: "Silver Toyota Corolla hatchback (E210), front three-quarter view", blur: [[.145, .605, .08, .095]], car: [.13, .87] },
  { n: 16, file: "FL5CTR.jpg", alt: "White Honda Civic Type R (FL5), front three-quarter view", focusY: .6 },
  { n: 17, file: "2018 Nissan GT-R Premium in Super Silver, Front Right, 10-11-2022.jpg", alt: "Super Silver Nissan GT-R (R35), front three-quarter view", car: [.01, .99] },
  { n: 18, file: "2022 Volkswagen Golf GTI in Oryx White Pearl, Front Left, 04-24-2022.jpg", alt: "White Volkswagen Golf GTI (Mk8), front three-quarter view", car: [.02, .98] },
  { n: 19, file: "2020 Volvo XC90 Inscription Pro T8 PHEV 2.0 (1).jpg", alt: "Dark blue Volvo XC90 T8 plug-in hybrid, front three-quarter view", blur: [[.785, .61, .125, .09]], car: [.04, .96] },
  { n: 20, file: "00 IONIQ 5 1.jpg", alt: "Teal-grey Hyundai Ioniq 5, front three-quarter view", blur: [[.575, .7, .11, .055]], car: [.09, .91] },
  { n: 21, file: "Kia Sportage 1.6 T-GDI HEV 2WD (2022) (cropped).jpg", alt: "White Kia Sportage hybrid (fifth generation), front three-quarter view", blur: [[.075, .62, .11, .09]], car: [.03, .97] },
  { n: 22, file: "2022 Land Rover Range Rover Sport.jpg", alt: "White third-generation Range Rover Sport, front three-quarter view", car: [.03, 1] },
  { n: 23, file: "2018 Jeep Wrangler Unlimited au SIAM 2018.jpg", alt: "Black Jeep Wrangler Unlimited Rubicon (JL) at a motor show, front three-quarter view", car: [.05, .95] },
  { n: 24, file: "2018 Ford Mustang GT 2.jpg", alt: "Blue Ford Mustang GT fastback (2018 facelift), front three-quarter view", blur: [[.665, .645, .15, .11]], car: [.09, .88] },
  { n: 25, file: "2021 Chevrolet Corvette C8.jpg", alt: "Red Chevrolet Corvette Stingray (C8), front three-quarter view", blur: [[.115, .61, .115, .155]], car: [.02, .96] },
  { n: 26, file: "2018 Lexus LC500, Deep Blue Mica, front right.jpg", alt: "Deep Blue Mica Lexus LC 500 coupé, front three-quarter view", blur: [[.915, .575, .05, .09]], car: [.03, .99] },
  { n: 27, file: "Porsche 911 (964) Carrera 2 (8468355535).jpg", alt: "Red Porsche 911 Carrera 2 (964 generation), front three-quarter view", blur: [[.19, .66, .15, .125]], focusY: .51 },
  { n: 28, file: "62 Jaguar E-Type (8941549403).jpg", alt: "Gunmetal grey 1962 Jaguar E-Type Series 1 fixed-head coupé at a classic car show" },
  { n: 29, file: "1971-Mercedes-Benz-280SL.jpg", alt: "Dark red Mercedes-Benz 280 SL 'Pagoda' (W113), side view", blur: [[.835, .635, .1, .105]], car: [.03, .97] },
  { n: 30, file: "2020 Toyota Hilux Revo Prerunner Double-Cab 2.4 Mid.jpg", alt: "Silver Toyota Hilux double cab (2020 facelift) in a showroom, front three-quarter view", car: [.02, .97] },
  { n: 31, file: "Lexus RX 350 2021.jpg", alt: "Grey Lexus RX 350 (fourth generation, facelift), front three-quarter view", blur: [[.105, .6, .13, .155]], focusY: .48 },
  { n: 32, file: "2018 Mercedes-AMG G 63 4MATIC Automatic 4.0 Front.jpg", alt: "Grey Mercedes-AMG G 63 (W463), front three-quarter view", blur: [[.815, .61, .13, .11]] },
  { n: 33, file: "Peugeot 208 B IMG 2565.jpg", alt: "Red Peugeot 208 (second generation), rear three-quarter view", blur: [[.735, .625, .155, .11]], car: [.03, .97] },
  { n: 34, file: "2019 Audi R8 Coupe Front.jpg", alt: "Light grey Audi R8 coupé (2019 facelift), front three-quarter view", blur: [[.958, .33, .042, .08], [.955, .6, .045, .08]], car: [.05, .97] },
];

/** Wide 16:9 banners reuse approved vehicle photos (same credits). */
export const BANNERS = {
  supercars: { n: 3 },
  luxury: { n: 6, focusY: .64 },
  performance: { n: 1 },
  suvs: { n: 22 },
  electric: { n: 20 },
  everyday: { n: 15, focusY: .55 },
  classics: { n: 28, focusY: .62 },
};
