/**
 * Base de conhecimento e motor de busca automática de Marca por Modelo de Veículo.
 * Suporta os principais automóveis, utilitários, picapes, caminhões e motos do mercado brasileiro.
 */

export interface ModeloVeiculoCatalogo {
  modelo: string;
  marca: string;
  categoria?: 'carro' | 'moto' | 'caminhao';
  variacoes?: string[];
}

// Catálogo com mais de 250 modelos populares com suas respectivas montadoras/marcas
export const CATALOGO_VEICULOS: ModeloVeiculoCatalogo[] = [
  // VOLKSWAGEN
  { modelo: 'Gol', marca: 'Volkswagen', variacoes: ['Gol G2', 'Gol G3', 'Gol G4', 'Gol G5', 'Gol G6', 'Gol G7', 'Gol G8', 'Gol 1.0', 'Gol 1.6'] },
  { modelo: 'Polo', marca: 'Volkswagen', variacoes: ['Polo Track', 'Polo TSI', 'Polo GTS', 'Polo Sedan'] },
  { modelo: 'Golf', marca: 'Volkswagen', variacoes: ['Golf GTI', 'Golf TSI', 'Golf Sportline', 'Golf Sapão'] },
  { modelo: 'Virtus', marca: 'Volkswagen', variacoes: ['Virtus TSI', 'Virtus Comfortline', 'Virtus Highline', 'Virtus GTS'] },
  { modelo: 'Voyage', marca: 'Volkswagen', variacoes: ['Voyage 1.0', 'Voyage 1.6', 'Voyage G5', 'Voyage G6'] },
  { modelo: 'Saveiro', marca: 'Volkswagen', variacoes: ['Saveiro Cross', 'Saveiro Robust', 'Saveiro Trendline', 'Saveiro G3', 'Saveiro G4'] },
  { modelo: 'Fox', marca: 'Volkswagen', variacoes: ['CrossFox', 'SpaceFox', 'Fox Pepper', 'Fox 1.0', 'Fox 1.6', 'SpaceCross'] },
  { modelo: 'T-Cross', marca: 'Volkswagen', variacoes: ['TCross', 'T Cross'] },
  { modelo: 'Nivus', marca: 'Volkswagen', variacoes: ['Nivus Highline', 'Nivus Comfortline'] },
  { modelo: 'Taos', marca: 'Volkswagen' },
  { modelo: 'Tiguan', marca: 'Volkswagen', variacoes: ['Tiguan Allspace', 'Tiguan R-Line'] },
  { modelo: 'Amarok', marca: 'Volkswagen', variacoes: ['Amarok V6', 'Amarok Highline', 'Amarok Extreme'] },
  { modelo: 'Up', marca: 'Volkswagen', variacoes: ['Up!', 'Up TSI', 'Cross Up', 'Move Up', 'Take Up'] },
  { modelo: 'Jetta', marca: 'Volkswagen', variacoes: ['Jetta GLI', 'Jetta TSI', 'Jetta Variant', 'Jetta 2.0'] },
  { modelo: 'Fusca', marca: 'Volkswagen', variacoes: ['Novo Fusca', 'Fusca TSI', 'Fuscão'] },
  { modelo: 'Kombi', marca: 'Volkswagen', variacoes: ['Kombi Carat', 'Kombi Furgão', 'Kombi Clipper'] },
  { modelo: 'Santana', marca: 'Volkswagen', variacoes: ['Santana Quantum', 'Quantum'] },
  { modelo: 'Parati', marca: 'Volkswagen', variacoes: ['Parati Track & Field', 'Parati Crossover', 'Parati G3', 'Parati G4'] },
  { modelo: 'Passat', marca: 'Volkswagen', variacoes: ['Passat CC', 'Passat Variant', 'Novo Passat'] },
  { modelo: 'Bora', marca: 'Volkswagen' },
  { modelo: 'Constellation', marca: 'Volkswagen', categoria: 'caminhao' },
  { modelo: 'Delivery', marca: 'Volkswagen', categoria: 'caminhao' },
  { modelo: 'Meteor', marca: 'Volkswagen', categoria: 'caminhao' },

  // CHEVROLET / GM
  { modelo: 'Onix', marca: 'Chevrolet', variacoes: ['Onix Plus', 'Onix Sedan', 'Onix RS', 'Onix Premier', 'Onix LT', 'Onix LTZ', 'Onix Joy'] },
  { modelo: 'Prisma', marca: 'Chevrolet', variacoes: ['Prisma Joy', 'Prisma LT', 'Prisma LTZ', 'Prisma Maxx'] },
  { modelo: 'Celta', marca: 'Chevrolet', variacoes: ['Celta Life', 'Celta Spirit', 'Celta Super'] },
  { modelo: 'Corsa', marca: 'Chevrolet', variacoes: ['Corsa Classic', 'Corsa Sedan', 'Corsa Hatch', 'Corsa Wind', 'Corsa Wagon', 'Corsa Pick-up'] },
  { modelo: 'Classic', marca: 'Chevrolet', variacoes: ['Classic Life', 'Classic Spirit', 'Classic LS'] },
  { modelo: 'Spin', marca: 'Chevrolet', variacoes: ['Spin Activ', 'Spin LTZ', 'Spin Premier'] },
  { modelo: 'Tracker', marca: 'Chevrolet', variacoes: ['Tracker Premier', 'Tracker RS', 'Tracker Turbo', 'Tracker Midnight'] },
  { modelo: 'Cruze', marca: 'Chevrolet', variacoes: ['Cruze Sport6', 'Cruze LT', 'Cruze LTZ', 'Cruze Premier', 'Cruze Midnight'] },
  { modelo: 'Montana', marca: 'Chevrolet', variacoes: ['Nova Montana', 'Montana Sport', 'Montana LS', 'Montana Premier'] },
  { modelo: 'S10', marca: 'Chevrolet', variacoes: ['S-10', 'S10 High Country', 'S10 LTZ', 'S10 Midnight', 'S10 Z71', 'S10 Cabine Dupla'] },
  { modelo: 'Trailblazer', marca: 'Chevrolet', variacoes: ['Trailblazer Premier', 'Trailblazer Diesel'] },
  { modelo: 'Cobalt', marca: 'Chevrolet', variacoes: ['Cobalt Elite', 'Cobalt LTZ'] },
  { modelo: 'Astra', marca: 'Chevrolet', variacoes: ['Astra Sedan', 'Astra Hatch', 'Astra SS', 'Astra Advantage', 'Astra GSI'] },
  { modelo: 'Vectra', marca: 'Chevrolet', variacoes: ['Vectra GT', 'Vectra Elegance', 'Vectra Elite', 'Vectra Expression', 'Vectra CD', 'Vectra GLS'] },
  { modelo: 'Meriva', marca: 'Chevrolet', variacoes: ['Meriva Maxx', 'Meriva Premium', 'Meriva Joy'] },
  { modelo: 'Zafira', marca: 'Chevrolet', variacoes: ['Zafira Elegance', 'Zafira Elite'] },
  { modelo: 'Agile', marca: 'Chevrolet', variacoes: ['Agile LTZ'] },
  { modelo: 'Captiva', marca: 'Chevrolet', variacoes: ['Captiva Sport', 'Captiva V6'] },
  { modelo: 'Equinox', marca: 'Chevrolet', variacoes: ['Equinox Premier', 'Equinox RS'] },
  { modelo: 'Camaro', marca: 'Chevrolet', variacoes: ['Camaro SS'] },
  { modelo: 'Kadett', marca: 'Chevrolet', variacoes: ['Kadett GSI', 'Kadett GL', 'Kadett Ipanema', 'Ipanema'] },
  { modelo: 'Monza', marca: 'Chevrolet', variacoes: ['Monza Tubarão', 'Monza Classic', 'Monza SL/E'] },
  { modelo: 'Opala', marca: 'Chevrolet', variacoes: ['Opala Comodoro', 'Opala Diplomata', 'Caravan'] },
  { modelo: 'Chevette', marca: 'Chevrolet', variacoes: ['Chevette Junior', 'Chevy 500', 'Marajó'] },

  // FIAT
  { modelo: 'Palio', marca: 'Fiat', variacoes: ['Palio Fire', 'Palio Weekend', 'Palio Adventure', 'Palio Sporting', 'Palio Attractive', 'Palio Essence', 'Palio Young', 'Palio ELX'] },
  { modelo: 'Uno', marca: 'Fiat', variacoes: ['Uno Mille', 'Mille Fire', 'Mille Way', 'Uno Way', 'Uno Attractive', 'Uno Sporting', 'Novo Uno', 'Uno Vivace'] },
  { modelo: 'Strada', marca: 'Fiat', variacoes: ['Nova Strada', 'Strada Volcano', 'Strada Ranch', 'Strada Ultra', 'Strada Endurance', 'Strada Freedom', 'Strada Working', 'Strada Adventure'] },
  { modelo: 'Toro', marca: 'Fiat', variacoes: ['Toro Volcano', 'Toro Ranch', 'Toro Ultra', 'Toro Freedom', 'Toro Endurance'] },
  { modelo: 'Mobi', marca: 'Fiat', variacoes: ['Mobi Like', 'Mobi Trekking', 'Mobi Easy'] },
  { modelo: 'Argo', marca: 'Fiat', variacoes: ['Argo Drive', 'Argo Trekking', 'Argo Precision', 'Argo HGT'] },
  { modelo: 'Cronos', marca: 'Fiat', variacoes: ['Cronos Drive', 'Cronos Precision'] },
  { modelo: 'Pulse', marca: 'Fiat', variacoes: ['Pulse Abarth', 'Pulse Drive', 'Pulse Audace', 'Pulse Impetus'] },
  { modelo: 'Fastback', marca: 'Fiat', variacoes: ['Fastback Abarth', 'Fastback Audace', 'Fastback Impetus', 'Fastback Limited'] },
  { modelo: 'Siena', marca: 'Fiat', variacoes: ['Grand Siena', 'Siena Fire', 'Siena EL', 'Siena HLX', 'Siena Tetrafuel'] },
  { modelo: 'Punto', marca: 'Fiat', variacoes: ['Punto T-Jet', 'Punto Sporting', 'Punto Attractive', 'Punto Essence', 'Punto Blackmotion'] },
  { modelo: 'Bravo', marca: 'Fiat', variacoes: ['Bravo T-Jet', 'Bravo Sporting', 'Bravo Essence', 'Bravo Absolute'] },
  { modelo: 'Doblò', marca: 'Fiat', variacoes: ['Doblo', 'Doblo Adventure', 'Doblo Cargo'] },
  { modelo: 'Fiorino', marca: 'Fiat', variacoes: ['Fiorino Furgão', 'Fiorino Hard Working', 'Fiorino Endurance'] },
  { modelo: 'Ducato', marca: 'Fiat', variacoes: ['Ducato Minibus', 'Ducato Maxicargo', 'Ducato Multi'] },
  { modelo: 'Idea', marca: 'Fiat', variacoes: ['Idea Adventure', 'Idea Attractive', 'Idea Essence'] },
  { modelo: 'Linea', marca: 'Fiat', variacoes: ['Linea T-Jet', 'Linea Absolute', 'Linea Essence'] },
  { modelo: 'Stilo', marca: 'Fiat', variacoes: ['Stilo Sporting', 'Stilo Abarth', 'Stilo Dualogic'] },
  { modelo: 'Freemont', marca: 'Fiat', variacoes: ['Freemont Emotion', 'Freemont Precision'] },
  { modelo: 'Titano', marca: 'Fiat', variacoes: ['Titano Volcano', 'Titano Ranch'] },
  { modelo: 'Tempra', marca: 'Fiat', variacoes: ['Tempra Turbo', 'Tempra Ouro'] },
  { modelo: 'Marea', marca: 'Fiat', variacoes: ['Marea Weekend', 'Marea Turbo', 'Marea ELX'] },
  { modelo: 'Tipo', marca: 'Fiat', variacoes: ['Tipo Sedicivalvole', 'Tipo 1.6'] },
  { modelo: '147', marca: 'Fiat', variacoes: ['Fiat 147', 'Spazio', 'Oggi', 'Panorama'] },

  // FORD
  { modelo: 'Ka', marca: 'Ford', variacoes: ['Ka Sedan', 'Ka+', 'Ka Plus', 'Ka Freestyle', 'Novo Ka', 'Ka Action', 'Ka XR'] },
  { modelo: 'Fiesta', marca: 'Ford', variacoes: ['New Fiesta', 'Fiesta Sedan', 'Fiesta Rocam', 'Fiesta Trail', 'Fiesta Street', 'Fiesta Titanium'] },
  { modelo: 'EcoSport', marca: 'Ford', variacoes: ['Ecosport Titanium', 'Ecosport Freestyle', 'Ecosport Storm', 'Ecosport 4WD', 'Ecosport 1.6', 'Ecosport 2.0'] },
  { modelo: 'Focus', marca: 'Ford', variacoes: ['Focus Sedan', 'Focus Fastback', 'Focus Hatch', 'Focus Titanium', 'Focus Ghia', 'Focus 2.0'] },
  { modelo: 'Ranger', marca: 'Ford', variacoes: ['Nova Ranger', 'Ranger XLS', 'Ranger XLT', 'Ranger Limited', 'Ranger Raptor', 'Ranger Black', 'Ranger FX4'] },
  { modelo: 'Fusion', marca: 'Ford', variacoes: ['Fusion Titanium', 'Fusion Hybrid', 'Fusion AWD', 'Fusion SEL', 'Fusion V6'] },
  { modelo: 'Territory', marca: 'Ford', variacoes: ['Territory Titanium'] },
  { modelo: 'Maverick', marca: 'Ford', variacoes: ['Maverick Lariat', 'Maverick Hybrid'] },
  { modelo: 'Bronco', marca: 'Ford', variacoes: ['Bronco Sport', 'Bronco Wildtrak'] },
  { modelo: 'Courier', marca: 'Ford', variacoes: ['Courier XL', 'Courier 1.6'] },
  { modelo: 'Escort', marca: 'Ford', variacoes: ['Escort XR3', 'Escort GL', 'Escort SW', 'Escort Zetec', 'Escort Hobby'] },
  { modelo: 'Del Rey', marca: 'Ford', variacoes: ['Del Rey Ghia', 'Belina', 'Scala', 'Corcel'] },
  { modelo: 'Edge', marca: 'Ford', variacoes: ['Edge Titanium', 'Edge ST'] },
  { modelo: 'Mustang', marca: 'Ford', variacoes: ['Mustang GT', 'Mustang Mach 1', 'Mustang Black Shadow'] },
  { modelo: 'Transit', marca: 'Ford', variacoes: ['Transit Furgão', 'Transit Minibus'] },
  { modelo: 'F-1000', marca: 'Ford', variacoes: ['F1000', 'F-250', 'F250', 'F-4000', 'F4000'] },

  // HONDA
  { modelo: 'Civic', marca: 'Honda', variacoes: ['Civic EXL', 'Civic Touring', 'Civic Sport', 'Civic LXR', 'Civic LXS', 'Civic Si', 'Civic Type R', 'New Civic', 'Civic G10', 'Civic G9'] },
  { modelo: 'Fit', marca: 'Honda', variacoes: ['Fit EXL', 'Fit EX', 'Fit LX', 'Fit DX', 'Fit Twist', 'New Fit'] },
  { modelo: 'City', marca: 'Honda', variacoes: ['City Sedan', 'City Hatch', 'City EXL', 'City Touring', 'City LX'] },
  { modelo: 'HR-V', marca: 'Honda', variacoes: ['HRV', 'HR-V EXL', 'HR-V Touring', 'HR-V Advance', 'Novo HR-V'] },
  { modelo: 'CR-V', marca: 'Honda', variacoes: ['CRV', 'CR-V EXL', 'CR-V Touring', 'CR-V Hybrid'] },
  { modelo: 'WR-V', marca: 'Honda', variacoes: ['WRV', 'WR-V EXL', 'WR-V EX'] },
  { modelo: 'ZR-V', marca: 'Honda', variacoes: ['ZRV', 'ZR-V Touring'] },
  { modelo: 'Accord', marca: 'Honda', variacoes: ['Accord Touring', 'Accord Hybrid', 'Accord EX'] },
  // Motos Honda
  { modelo: 'CG 160', marca: 'Honda', categoria: 'moto', variacoes: ['CG 160 Titan', 'CG 160 Fan', 'CG 160 Start', 'CG 160 Cargo', 'Titan 160', 'Fan 160'] },
  { modelo: 'CG 150', marca: 'Honda', categoria: 'moto', variacoes: ['CG 150 Titan', 'CG 150 Fan', 'Titan 150', 'Fan 150'] },
  { modelo: 'CG 125', marca: 'Honda', categoria: 'moto', variacoes: ['CG 125 Fan', 'CG 125 Today', 'Titan 125', 'Fan 125'] },
  { modelo: 'Biz', marca: 'Honda', categoria: 'moto', variacoes: ['Biz 125', 'Biz 110i', 'Biz 100', 'Biz +'] },
  { modelo: 'NXR Bros', marca: 'Honda', categoria: 'moto', variacoes: ['NXR 160 Bros', 'NXR 150 Bros', 'Bros 160', 'Bros 150', 'Bros'] },
  { modelo: 'Pop 110i', marca: 'Honda', categoria: 'moto', variacoes: ['Pop 110', 'Pop 100'] },
  { modelo: 'CB 300F', marca: 'Honda', categoria: 'moto', variacoes: ['CB 300', 'CB 300R', 'Twister 300', 'CB 300F Twister'] },
  { modelo: 'CB Twister', marca: 'Honda', categoria: 'moto', variacoes: ['CB 250F Twister', 'Twister 250', 'CBX 250 Twister'] },
  { modelo: 'CB 500', marca: 'Honda', categoria: 'moto', variacoes: ['CB 500F', 'CB 500X', 'CBR 500R'] },
  { modelo: 'CB 650', marca: 'Honda', categoria: 'moto', variacoes: ['CB 650R', 'CBR 650R', 'CB 650F'] },
  { modelo: 'XRE 300', marca: 'Honda', categoria: 'moto', variacoes: ['XRE 300 Rally', 'XRE 300 Adventure', 'Sahara 300'] },
  { modelo: 'XRE 190', marca: 'Honda', categoria: 'moto', variacoes: ['XRE 190 Adventure'] },
  { modelo: 'PCX', marca: 'Honda', categoria: 'moto', variacoes: ['PCX 150', 'PCX 160', 'PCX DLX', 'PCX Sport'] },
  { modelo: 'Elite 125', marca: 'Honda', categoria: 'moto', variacoes: ['Elite'] },
  { modelo: 'ADV 150', marca: 'Honda', categoria: 'moto', variacoes: ['ADV 160', 'ADV'] },
  { modelo: 'Hornet', marca: 'Honda', categoria: 'moto', variacoes: ['CB 600F Hornet'] },
  { modelo: 'NC 750X', marca: 'Honda', categoria: 'moto', variacoes: ['NC 750', 'NC 700'] },
  { modelo: 'Transalp', marca: 'Honda', categoria: 'moto', variacoes: ['XL 700V Transalp'] },
  { modelo: 'Africa Twin', marca: 'Honda', categoria: 'moto', variacoes: ['CRF 1100L Africa Twin'] },

  // TOYOTA
  { modelo: 'Corolla', marca: 'Toyota', variacoes: ['Corolla Altis', 'Corolla XEi', 'Corolla GLi', 'Corolla GR-Sport', 'Corolla Hybrid', 'Novo Corolla', 'Corolla SEG', 'Corolla XRS'] },
  { modelo: 'Corolla Cross', marca: 'Toyota', variacoes: ['Corolla Cross XRE', 'Corolla Cross XRX', 'Corolla Cross XR', 'Corolla Cross Hybrid'] },
  { modelo: 'Hilux', marca: 'Toyota', variacoes: ['Hilux SRX', 'Hilux SRV', 'Hilux SR', 'Hilux GR-Sport', 'Hilux SW4', 'Hilux Cabine Dupla', 'Hilux 4x4'] },
  { modelo: 'SW4', marca: 'Toyota', variacoes: ['SW4 Diamond', 'SW4 SRX', 'SW4 GR-Sport'] },
  { modelo: 'Etios', marca: 'Toyota', variacoes: ['Etios Sedan', 'Etios Hatch', 'Etios Cross', 'Etios X', 'Etios XLS', 'Etios Platinum'] },
  { modelo: 'Yaris', marca: 'Toyota', variacoes: ['Yaris Sedan', 'Yaris Hatch', 'Yaris XLS', 'Yaris XS', 'Yaris XL'] },
  { modelo: 'RAV4', marca: 'Toyota', variacoes: ['RAV4 Hybrid', 'RAV4 4x4'] },
  { modelo: 'Prius', marca: 'Toyota', variacoes: ['Prius Hybrid'] },
  { modelo: 'Camry', marca: 'Toyota', variacoes: ['Camry V6', 'Camry XLE'] },
  { modelo: 'Bandeirante', marca: 'Toyota', variacoes: ['Toyota Bandeirante'] },

  // HYUNDAI
  { modelo: 'HB20', marca: 'Hyundai', variacoes: ['HB20S', 'HB20X', 'HB20 Sense', 'HB20 Comfort', 'HB20 Platinum', 'HB20 Diamond', 'HB20 1.0', 'HB20 1.6', 'Novo HB20'] },
  { modelo: 'Creta', marca: 'Hyundai', variacoes: ['Creta Attitude', 'Creta Pulse', 'Creta Prestige', 'Creta N Line', 'Novo Creta', 'Creta Platinum'] },
  { modelo: 'Tucson', marca: 'Hyundai', variacoes: ['New Tucson', 'Tucson GLS', 'Tucson GL'] },
  { modelo: 'Santa Fe', marca: 'Hyundai', variacoes: ['Santa Fé', 'Santa Fe V6'] },
  { modelo: 'ix35', marca: 'Hyundai', variacoes: ['IX 35', 'ix35 GLS'] },
  { modelo: 'i30', marca: 'Hyundai', variacoes: ['i30 CW', 'i30 2.0', 'i30 1.6'] },
  { modelo: 'Azera', marca: 'Hyundai', variacoes: ['Azera V6', 'Azera 3.3', 'Azera 3.0'] },
  { modelo: 'Elantra', marca: 'Hyundai', variacoes: ['Elantra GLS'] },
  { modelo: 'Veloster', marca: 'Hyundai' },
  { modelo: 'HR', marca: 'Hyundai', variacoes: ['Hyundai HR', 'HR Furgão'] },
  { modelo: 'Sonata', marca: 'Hyundai' },
  { modelo: 'Vera Cruz', marca: 'Hyundai', variacoes: ['Veracruz'] },

  // RENAULT
  { modelo: 'Sandero', marca: 'Renault', variacoes: ['Sandero Stepway', 'Stepway', 'Sandero RS', 'Sandero Dynamique', 'Sandero Expression', 'Sandero Authentique', 'Sandero GT Line'] },
  { modelo: 'Logan', marca: 'Renault', variacoes: ['Logan Dynamique', 'Logan Expression', 'Logan Authentique', 'Logan Zen', 'Logan Intense'] },
  { modelo: 'Duster', marca: 'Renault', variacoes: ['Duster Dynamique', 'Duster Iconic', 'Duster Intense', 'Duster 4x4', 'Duster Techroad'] },
  { modelo: 'Oroch', marca: 'Renault', variacoes: ['Duster Oroch', 'Oroch Dynamique', 'Oroch Outsider', 'Oroch Intense'] },
  { modelo: 'Kwid', marca: 'Renault', variacoes: ['Kwid Zen', 'Kwid Intense', 'Kwid Outsider', 'Kwid Life'] },
  { modelo: 'Captur', marca: 'Renault', variacoes: ['Captur Intense', 'Captur Bose', 'Captur Zen'] },
  { modelo: 'Kardian', marca: 'Renault', variacoes: ['Kardian Premiere', 'Kardian Techno', 'Kardian Evolution'] },
  { modelo: 'Clio', marca: 'Renault', variacoes: ['Clio Sedan', 'Clio Campus', 'Clio Authentique', 'Clio Expression'] },
  { modelo: 'Master', marca: 'Renault', variacoes: ['Master Furgão', 'Master Minibus', 'Master Chassi'] },
  { modelo: 'Kangoo', marca: 'Renault', variacoes: ['Kangoo Express'] },
  { modelo: 'Fluence', marca: 'Renault', variacoes: ['Fluence Dynamique', 'Fluence Privilège', 'Fluence GT'] },
  { modelo: 'Megane', marca: 'Renault', variacoes: ['Megane Grand Tour', 'Megane Sedan'] },
  { modelo: 'Scenic', marca: 'Renault', variacoes: ['Scénic'] },

  // JEEP
  { modelo: 'Renegade', marca: 'Jeep', variacoes: ['Renegade Longitude', 'Renegade Trailhawk', 'Renegade Sport', 'Renegade Limited', 'Renegade Night Eagle', 'Renegade Serie S'] },
  { modelo: 'Compass', marca: 'Jeep', variacoes: ['Compass Longitude', 'Compass Limited', 'Compass Trailhawk', 'Compass Serie S', 'Compass Sport', 'Compass 4xe'] },
  { modelo: 'Commander', marca: 'Jeep', variacoes: ['Commander Limited', 'Commander Overland', 'Commander Blackhawk'] },
  { modelo: 'Wrangler', marca: 'Jeep', variacoes: ['Wrangler Rubicon', 'Wrangler Sahara'] },
  { modelo: 'Cherokee', marca: 'Jeep', variacoes: ['Grand Cherokee', 'Cherokee Sport', 'Grand Cherokee Limited'] },

  // NISSAN
  { modelo: 'Kicks', marca: 'Nissan', variacoes: ['Kicks SV', 'Kicks SL', 'Kicks Advance', 'Kicks Exclusive', 'Kicks Sense', 'Kicks UEFA'] },
  { modelo: 'Versa', marca: 'Nissan', variacoes: ['Versa Exclusive', 'Versa Advance', 'Versa Sense', 'Versa SV', 'Versa SL', 'V-Drive'] },
  { modelo: 'March', marca: 'Nissan', variacoes: ['March SV', 'March SL', 'March 1.0', 'March 1.6', 'March Rio'] },
  { modelo: 'Sentra', marca: 'Nissan', variacoes: ['Sentra Exclusive', 'Sentra Advance', 'Sentra SV', 'Sentra SL', 'Sentra B17'] },
  { modelo: 'Frontier', marca: 'Nissan', variacoes: ['Frontier Attack', 'Frontier PRO-4X', 'Frontier Platinum', 'Frontier XE', 'Frontier LE', 'Frontier SV'] },
  { modelo: 'Tiida', marca: 'Nissan', variacoes: ['Tiida Sedan', 'Tiida Hatch', 'Tiida SL'] },
  { modelo: 'Livina', marca: 'Nissan', variacoes: ['Grand Livina', 'Livina X-Gear'] },

  // PEUGEOT
  { modelo: '208', marca: 'Peugeot', variacoes: ['Novo 208', '208 Griffe', '208 Allure', '208 Style', '208 GT', '208 Active'] },
  { modelo: '2008', marca: 'Peugeot', variacoes: ['Novo 2008', '2008 Griffe', '2008 Allure', '2008 THP'] },
  { modelo: '207', marca: 'Peugeot', variacoes: ['207 Passion', '207 SW', '207 XR', '207 XS', 'Hoggar'] },
  { modelo: '206', marca: 'Peugeot', variacoes: ['206 CC', '206 SW', '206 Rallye', '206 Soleil', '206 Feline'] },
  { modelo: '308', marca: 'Peugeot', variacoes: ['308 Allure', '308 Griffe', '308 THP'] },
  { modelo: '307', marca: 'Peugeot', variacoes: ['307 Sedan', '307 Hatch', '307 Feline'] },
  { modelo: '3008', marca: 'Peugeot', variacoes: ['3008 Griffe', '3008 GT'] },
  { modelo: '408', marca: 'Peugeot', variacoes: ['408 Griffe', '408 Allure', '408 THP'] },
  { modelo: 'Partner', marca: 'Peugeot', variacoes: ['Partner Rapid', 'Partner Furgão'] },
  { modelo: 'Expert', marca: 'Peugeot', variacoes: ['Expert Minibus', 'Expert Furgão'] },
  { modelo: 'Boxer', marca: 'Peugeot', variacoes: ['Boxer Minibus', 'Boxer Furgão'] },

  // CITROËN
  { modelo: 'C3', marca: 'Citroën', variacoes: ['Citroen C3', 'Novo C3', 'C3 Live', 'C3 Feel', 'C3 First Edition', 'C3 Picasso', 'C3 Tendance', 'C3 Exclusive', 'C3 Aircross'] },
  { modelo: 'C4 Cactus', marca: 'Citroën', variacoes: ['C4', 'C4 Lounge', 'C4 Pallas', 'C4 Picasso', 'Grand C4 Picasso', 'C4 VTR', 'C4 Feel', 'C4 Shine'] },
  { modelo: 'Aircross', marca: 'Citroën', variacoes: ['Novo Aircross', 'Citroen Aircross', 'Aircross Feel', 'Aircross Shine'] },
  { modelo: 'Berlingo', marca: 'Citroën', variacoes: ['Berlingo Furgão', 'Berlingo Multispace'] },
  { modelo: 'Jumpy', marca: 'Citroën', variacoes: ['Jumpy Furgão', 'Jumpy Minibus'] },
  { modelo: 'Jumper', marca: 'Citroën', variacoes: ['Jumper Furgão', 'Jumper Minibus'] },
  { modelo: 'Xsara', marca: 'Citroën', variacoes: ['Xsara Picasso', 'Xsara Break', 'Xsara VTS'] },

  // MITSUBISHI
  { modelo: 'L200', marca: 'Mitsubishi', variacoes: ['L200 Triton', 'Triton Sport', 'L200 Outdoor', 'L200 Savana', 'L200 GL', 'L200 GLS'] },
  { modelo: 'Pajero', marca: 'Mitsubishi', variacoes: ['Pajero TR4', 'Pajero Dakar', 'Pajero Full', 'Pajero Sport', 'TR4'] },
  { modelo: 'ASX', marca: 'Mitsubishi', variacoes: ['ASX 4x4', 'ASX 4x2', 'ASX Outdoor'] },
  { modelo: 'Eclipse Cross', marca: 'Mitsubishi', variacoes: ['Eclipse Cross HPE', 'Eclipse Cross Rush'] },
  { modelo: 'Outlander', marca: 'Mitsubishi', variacoes: ['Outlander GT', 'Outlander Comfort', 'Outlander PHEV'] },
  { modelo: 'Lancer', marca: 'Mitsubishi', variacoes: ['Lancer GT', 'Lancer HL', 'Lancer Evolution'] },

  // KIA
  { modelo: 'Sportage', marca: 'Kia', variacoes: ['Sportage EX', 'Sportage LX', 'Nova Sportage'] },
  { modelo: 'Cerato', marca: 'Kia', variacoes: ['Cerato SX', 'Cerato EX'] },
  { modelo: 'Seltos', marca: 'Kia' },
  { modelo: 'Carnival', marca: 'Kia', variacoes: ['Grand Carnival'] },
  { modelo: 'Sorento', marca: 'Kia', variacoes: ['Sorento V6'] },
  { modelo: 'Soul', marca: 'Kia' },
  { modelo: 'Picanto', marca: 'Kia', variacoes: ['Picanto EX'] },
  { modelo: 'Bongo', marca: 'Kia', variacoes: ['Bongo K2500'] },

  // BMW
  { modelo: 'Série 3', marca: 'BMW', variacoes: ['320i', '328i', '330i', '325i', '318i', '320i GP', '320i M Sport', 'M3'] },
  { modelo: 'Série 1', marca: 'BMW', variacoes: ['118i', '120i', '125i', '130i', 'M135i', 'M140i'] },
  { modelo: 'Série 5', marca: 'BMW', variacoes: ['520i', '528i', '530i', '540i', '550i', 'M5'] },
  { modelo: 'X1', marca: 'BMW', variacoes: ['X1 sDrive20i', 'X1 xLine', 'X1 M Sport'] },
  { modelo: 'X3', marca: 'BMW', variacoes: ['X3 xDrive30i', 'X3 M40i'] },
  { modelo: 'X5', marca: 'BMW', variacoes: ['X5 xDrive45e', 'X5 M'] },
  { modelo: 'X6', marca: 'BMW', variacoes: ['X6 xDrive40i', 'X6 M'] },
  // Motos BMW
  { modelo: 'R 1250 GS', marca: 'BMW', categoria: 'moto', variacoes: ['R1250GS', 'R 1200 GS', 'R1200GS', 'GS 1250', 'GS 1200', 'R 1250 GS Adventure'] },
  { modelo: 'F 850 GS', marca: 'BMW', categoria: 'moto', variacoes: ['F850GS', 'F 750 GS', 'F750GS', 'F 800 GS', 'F800GS'] },
  { modelo: 'G 310 GS', marca: 'BMW', categoria: 'moto', variacoes: ['G310GS', 'G 310 R', 'G310R'] },
  { modelo: 'S 1000 RR', marca: 'BMW', categoria: 'moto', variacoes: ['S1000RR', 'S 1000 XR', 'S 1000 R'] },

  // MERCEDES-BENZ
  { modelo: 'Classe C', marca: 'Mercedes-Benz', variacoes: ['C180', 'C200', 'C250', 'C300', 'C63 AMG', 'C 180', 'C 200', 'C 250', 'C 300'] },
  { modelo: 'Classe A', marca: 'Mercedes-Benz', variacoes: ['A200', 'A250', 'A45 AMG', 'A 200', 'A 250'] },
  { modelo: 'CLA', marca: 'Mercedes-Benz', variacoes: ['CLA 200', 'CLA 250', 'CLA 180', 'CLA 45 AMG'] },
  { modelo: 'GLA', marca: 'Mercedes-Benz', variacoes: ['GLA 200', 'GLA 250', 'GLA 45 AMG'] },
  { modelo: 'GLC', marca: 'Mercedes-Benz', variacoes: ['GLC 250', 'GLC 300', 'GLC 43 AMG'] },
  { modelo: 'GLE', marca: 'Mercedes-Benz', variacoes: ['GLE 400', 'GLE 450', 'GLE 63 AMG'] },
  { modelo: 'Sprinter', marca: 'Mercedes-Benz', variacoes: ['Sprinter 311', 'Sprinter 313', 'Sprinter 415', 'Sprinter 515', 'Sprinter 416', 'Sprinter 516'] },
  { modelo: 'Accelo', marca: 'Mercedes-Benz', categoria: 'caminhao', variacoes: ['Accelo 815', 'Accelo 1016'] },
  { modelo: 'Atego', marca: 'Mercedes-Benz', categoria: 'caminhao', variacoes: ['Atego 2426', 'Atego 1719'] },
  { modelo: 'Axor', marca: 'Mercedes-Benz', categoria: 'caminhao', variacoes: ['Axor 2544', 'Axor 2036'] },
  { modelo: 'Actros', marca: 'Mercedes-Benz', categoria: 'caminhao', variacoes: ['Actros 2651', 'Actros 2546'] },

  // AUDI
  { modelo: 'A3', marca: 'Audi', variacoes: ['A3 Sedan', 'A3 Sportback', 'A3 1.4 TSI', 'A3 2.0 TFSI', 'S3', 'RS3'] },
  { modelo: 'A4', marca: 'Audi', variacoes: ['A4 Sedan', 'A4 Avant', 'S4', 'RS4'] },
  { modelo: 'A5', marca: 'Audi', variacoes: ['A5 Sportback', 'S5', 'RS5'] },
  { modelo: 'Q3', marca: 'Audi', variacoes: ['Q3 Sportback', 'RS Q3'] },
  { modelo: 'Q5', marca: 'Audi', variacoes: ['SQ5'] },
  { modelo: 'Q7', marca: 'Audi' },
  { modelo: 'Q8', marca: 'Audi', variacoes: ['RS Q8', 'Q8 e-tron'] },

  // VOLVO
  { modelo: 'XC40', marca: 'Volvo', variacoes: ['XC40 Recharge', 'XC40 T4', 'XC40 T5'] },
  { modelo: 'XC60', marca: 'Volvo', variacoes: ['XC60 Recharge', 'XC60 T8', 'XC60 T5'] },
  { modelo: 'XC90', marca: 'Volvo', variacoes: ['XC90 Recharge', 'XC90 T8'] },
  { modelo: 'V40', marca: 'Volvo', variacoes: ['V40 Cross Country'] },
  { modelo: 'C40', marca: 'Volvo', variacoes: ['C40 Recharge'] },
  { modelo: 'EX30', marca: 'Volvo' },
  { modelo: 'FH', marca: 'Volvo', categoria: 'caminhao', variacoes: ['FH 540', 'FH 460', 'FH 500'] },
  { modelo: 'VM', marca: 'Volvo', categoria: 'caminhao', variacoes: ['VM 270', 'VM 330'] },

  // CAOA CHERY
  { modelo: 'Tiggo 5X', marca: 'Caoa Chery', variacoes: ['Tiggo 5X Pro', 'Tiggo 5X Pro Hybrid', 'Tiggo 5X TXS'] },
  { modelo: 'Tiggo 7', marca: 'Caoa Chery', variacoes: ['Tiggo 7 Pro', 'Tiggo 7 Pro Hybrid', 'Tiggo 7 TXS'] },
  { modelo: 'Tiggo 8', marca: 'Caoa Chery', variacoes: ['Tiggo 8 Pro', 'Tiggo 8 Pro Plug-in Hybrid', 'Tiggo 8 TXS'] },
  { modelo: 'Tiggo 2', marca: 'Caoa Chery', variacoes: ['Tiggo 2 ACT', 'Tiggo 2 Look'] },
  { modelo: 'Tiggo 3X', marca: 'Caoa Chery', variacoes: ['Tiggo 3X Pro', 'Tiggo 3X Plus'] },
  { modelo: 'Arrizo 6', marca: 'Caoa Chery', variacoes: ['Arrizo 6 Pro', 'Arrizo 6 GSX'] },
  { modelo: 'Arrizo 5', marca: 'Caoa Chery', variacoes: ['Arrizo 5 RX', 'Arrizo 5 RT'] },
  { modelo: 'iCar', marca: 'Caoa Chery' },
  { modelo: 'QQ', marca: 'Chery', variacoes: ['Chery QQ', 'Novo QQ'] },

  // BYD
  { modelo: 'Dolphin', marca: 'BYD', variacoes: ['Dolphin Mini', 'Dolphin Plus', 'BYD Dolphin'] },
  { modelo: 'Song Plus', marca: 'BYD', variacoes: ['Song Plus DM-i', 'BYD Song'] },
  { modelo: 'Yuan Plus', marca: 'BYD', variacoes: ['Yuan Plus EV', 'BYD Yuan'] },
  { modelo: 'Seal', marca: 'BYD', variacoes: ['BYD Seal'] },
  { modelo: 'King', marca: 'BYD', variacoes: ['King DM-i', 'BYD King'] },
  { modelo: 'Shark', marca: 'BYD', variacoes: ['BYD Shark'] },
  { modelo: 'Tan', marca: 'BYD', variacoes: ['Tan EV', 'BYD Tan'] },
  { modelo: 'Han', marca: 'BYD', variacoes: ['Han EV', 'BYD Han'] },

  // GWM (Great Wall Motors)
  { modelo: 'Haval H6', marca: 'GWM', variacoes: ['Haval H6 HEV', 'Haval H6 PHEV', 'Haval H6 GT', 'Haval'] },
  { modelo: 'Ora 03', marca: 'GWM', variacoes: ['Ora 03 Skin', 'Ora 03 GT', 'GWM Ora'] },
  { modelo: 'Tank 300', marca: 'GWM', variacoes: ['GWM Tank'] },

  // RAM
  { modelo: 'Rampage', marca: 'Ram', variacoes: ['Rampage Rebel', 'Rampage Laramie', 'Rampage R/T'] },
  { modelo: 'Ram 1500', marca: 'Ram', variacoes: ['RAM 1500 Rebel', 'RAM 1500 Classic', 'RAM 1500 Limited'] },
  { modelo: 'Ram 2500', marca: 'Ram', variacoes: ['RAM 2500 Laramie'] },
  { modelo: 'Ram 3500', marca: 'Ram', variacoes: ['RAM 3500 Longhorn', 'RAM 3500 Laramie'] },

  // LAND ROVER
  { modelo: 'Evoque', marca: 'Land Rover', variacoes: ['Range Rover Evoque', 'Evoque SE', 'Evoque R-Dynamic'] },
  { modelo: 'Range Rover Velar', marca: 'Land Rover', variacoes: ['Velar', 'Range Rover Sport', 'Range Rover Vogue'] },
  { modelo: 'Discovery', marca: 'Land Rover', variacoes: ['Discovery Sport', 'Discovery 4', 'Discovery 5'] },
  { modelo: 'Defender', marca: 'Land Rover', variacoes: ['Defender 90', 'Defender 110', 'Defender 130'] },
  { modelo: 'Freelander', marca: 'Land Rover', variacoes: ['Freelander 2'] },

  // PORSCHE
  { modelo: 'Macan', marca: 'Porsche', variacoes: ['Macan T', 'Macan S', 'Macan GTS'] },
  { modelo: 'Cayenne', marca: 'Porsche', variacoes: ['Cayenne Coupe', 'Cayenne E-Hybrid', 'Cayenne Turbo'] },
  { modelo: '911', marca: 'Porsche', variacoes: ['911 Carrera', '911 Turbo', '911 GT3'] },
  { modelo: 'Panamera', marca: 'Porsche', variacoes: ['Panamera 4S', 'Panamera E-Hybrid'] },
  { modelo: 'Taycan', marca: 'Porsche', variacoes: ['Taycan 4S', 'Taycan Turbo', 'Taycan Cross Turismo'] },
  { modelo: '718 Boxster', marca: 'Porsche', variacoes: ['Boxster', 'Cayman', '718 Cayman'] },

  // SUZUKI
  { modelo: 'Jimny', marca: 'Suzuki', variacoes: ['Jimny Sierra', 'Jimny 4Style', 'Jimny 4Sport', 'Jimny 4You'] },
  { modelo: 'Grand Vitara', marca: 'Suzuki', variacoes: ['Vitara', 'Vitara 4x4'] },
  { modelo: 'Swift', marca: 'Suzuki', variacoes: ['Swift Sport'] },
  { modelo: 'SX4', marca: 'Suzuki', variacoes: ['S-Cross'] },
  // Motos Suzuki
  { modelo: 'Yes 125', marca: 'Suzuki', categoria: 'moto', variacoes: ['EN 125 Yes', 'Suzuki Yes'] },
  { modelo: 'Burgman', marca: 'Suzuki', categoria: 'moto', variacoes: ['Burgman 125', 'Burgman 400', 'Burgman 650'] },
  { modelo: 'Intruder 125', marca: 'Suzuki', categoria: 'moto', variacoes: ['Intruder', 'Intruder 250'] },
  { modelo: 'V-Strom', marca: 'Suzuki', categoria: 'moto', variacoes: ['V-Strom 650', 'V-Strom 1000', 'V-Strom 1050', 'DL 650 V-Strom'] },
  { modelo: 'Bandit', marca: 'Suzuki', categoria: 'moto', variacoes: ['Bandit 650', 'Bandit 1250', 'GSF 650 Bandit'] },

  // YAMAHA (Motos)
  { modelo: 'Fazer 250', marca: 'Yamaha', categoria: 'moto', variacoes: ['Fazer FZ25', 'FZ25', 'Fazer 150', 'FZ15', 'Fazer'] },
  { modelo: 'Factor 150', marca: 'Yamaha', categoria: 'moto', variacoes: ['Factor 125', 'Factor', 'YBR 125 Factor'] },
  { modelo: 'Crosser 150', marca: 'Yamaha', categoria: 'moto', variacoes: ['Crosser Z', 'Crosser S', 'XTZ 150 Crosser'] },
  { modelo: 'Lander 250', marca: 'Yamaha', categoria: 'moto', variacoes: ['XTZ 250 Lander', 'Lander'] },
  { modelo: 'Ténéré 250', marca: 'Yamaha', categoria: 'moto', variacoes: ['Tenere 250', 'XTZ 250 Tenere', 'Tenere 700'] },
  { modelo: 'MT-03', marca: 'Yamaha', categoria: 'moto', variacoes: ['MT03', 'MT 03'] },
  { modelo: 'MT-07', marca: 'Yamaha', categoria: 'moto', variacoes: ['MT07', 'MT 07'] },
  { modelo: 'MT-09', marca: 'Yamaha', categoria: 'moto', variacoes: ['MT09', 'MT 09'] },
  { modelo: 'NMAX 160', marca: 'Yamaha', categoria: 'moto', variacoes: ['NMAX', 'N Max', 'N-Max'] },
  { modelo: 'XMAX 250', marca: 'Yamaha', categoria: 'moto', variacoes: ['XMAX', 'X Max'] },
  { modelo: 'Fluo 125', marca: 'Yamaha', categoria: 'moto', variacoes: ['Fluo'] },
  { modelo: 'Neo 125', marca: 'Yamaha', categoria: 'moto', variacoes: ['Neo'] },
  { modelo: 'YZF-R3', marca: 'Yamaha', categoria: 'moto', variacoes: ['R3', 'Yamaha R3'] },

  // KAWASAKI (Motos)
  { modelo: 'Ninja 400', marca: 'Kawasaki', categoria: 'moto', variacoes: ['Ninja 300', 'Ninja 250', 'Ninja 650', 'Ninja ZX-6R', 'Ninja ZX-10R', 'Ninja'] },
  { modelo: 'Z400', marca: 'Kawasaki', categoria: 'moto', variacoes: ['Z300', 'Z650', 'Z900', 'Z1000'] },
  { modelo: 'Versys 650', marca: 'Kawasaki', categoria: 'moto', variacoes: ['Versys 300', 'Versys 1000', 'Versys-X 300'] },
  { modelo: 'Vulcan S', marca: 'Kawasaki', categoria: 'moto', variacoes: ['Vulcan 650'] },

  // TRIUMPH (Motos)
  { modelo: 'Tiger 900', marca: 'Triumph', categoria: 'moto', variacoes: ['Tiger 800', 'Tiger 1200', 'Tiger Sport 660', 'Tiger'] },
  { modelo: 'Street Triple', marca: 'Triumph', categoria: 'moto', variacoes: ['Street Triple 765', 'Speed Triple'] },
  { modelo: 'Bonneville', marca: 'Triumph', categoria: 'moto', variacoes: ['Bonneville T100', 'Bonneville T120'] },

  // IVECO
  { modelo: 'Daily', marca: 'Iveco', categoria: 'caminhao', variacoes: ['Daily 35S14', 'Daily 30S13', 'Daily 55C17', 'Daily Furgão'] },
  { modelo: 'Tector', marca: 'Iveco', categoria: 'caminhao', variacoes: ['Tector 24-280', 'Tector 17-280'] },

  // SCANIA
  { modelo: 'R 450', marca: 'Scania', categoria: 'caminhao', variacoes: ['R440', 'R450', 'R500', 'R540', 'Linha R', 'Scania R'] },

  // TROLLER
  { modelo: 'T4', marca: 'Troller', variacoes: ['Troller T4', 'TX4', 'Troller 3.2'] },

  // MINI
  { modelo: 'Cooper', marca: 'Mini', variacoes: ['Mini Cooper', 'Cooper S', 'Countryman', 'Clubman', 'John Cooper Works'] },

  // SUBARU
  { modelo: 'Impreza', marca: 'Subaru', variacoes: ['Impreza WRX', 'WRX STI'] },
  { modelo: 'Forester', marca: 'Subaru', variacoes: ['Forester XT'] },
  { modelo: 'XV', marca: 'Subaru', variacoes: ['Subaru XV', 'Crosstrek'] },

  // JAC MOTORS
  { modelo: 'J3', marca: 'JAC Motors', variacoes: ['J3 Turin', 'J2', 'J5', 'J6'] },
  { modelo: 'T40', marca: 'JAC Motors', variacoes: ['T50', 'T60', 'T80', 'E-JS1'] },
];

/**
 * Função utilitária para normalizar strings para busca sem acentos e minúsculas
 */
function normalizarTexto(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export interface ResultadoDeteccaoMarca {
  marca: string;
  modeloNome: string;
  termoDetectado: string;
  confianca: 'alta' | 'media';
}

/**
 * Detecta a marca do veículo a partir de um termo digitado no campo de modelo.
 * Exemplo: "Civic 2.0 EXL" -> { marca: "Honda", modeloNome: "Civic" }
 * Exemplo: "Gol 1.6 MSI" -> { marca: "Volkswagen", modeloNome: "Gol" }
 * Exemplo: "Hilux SRX" -> { marca: "Toyota", modeloNome: "Hilux" }
 */
export function detectarMarcaPorModelo(termo: string): ResultadoDeteccaoMarca | null {
  if (!termo || termo.trim().length < 2) return null;

  const termoLimpo = normalizarTexto(termo);
  const palavrasTermo = termoLimpo.split(/[\s,/-]+/).filter((p) => p.length >= 2);

  // 1. Verificação se o próprio usuário já digitou o nome da marca dentro do modelo (ex: "Honda Civic")
  const marcasConhecidas = [
    'volkswagen', 'chevrolet', 'fiat', 'ford', 'honda', 'toyota', 'hyundai',
    'renault', 'jeep', 'nissan', 'peugeot', 'citroen', 'mitsubishi', 'kia',
    'bmw', 'mercedes', 'mercedes-benz', 'audi', 'volvo', 'caoa chery', 'chery',
    'byd', 'gwm', 'ram', 'land rover', 'porsche', 'suzuki', 'yamaha', 'kawasaki',
    'triumph', 'iveco', 'scania', 'troller', 'mini', 'subaru', 'jac motors', 'jac'
  ];

  for (const m of marcasConhecidas) {
    if (termoLimpo.startsWith(m) || termoLimpo.includes(` ${m} `) || termoLimpo.endsWith(` ${m}`)) {
      const matchItem = CATALOGO_VEICULOS.find(
        (item) => normalizarTexto(item.marca) === m || normalizarTexto(item.marca).includes(m)
      );
      if (matchItem) {
        return {
          marca: matchItem.marca,
          modeloNome: termo.trim(),
          termoDetectado: matchItem.marca,
          confianca: 'alta',
        };
      }
    }
  }

  // 2. Busca exata ou prefixo no modelo principal do catálogo (ex: "Civic", "Gol", "Corolla", "Onix")
  for (const item of CATALOGO_VEICULOS) {
    const modeloLimpo = normalizarTexto(item.modelo);

    // Se o termo digitado começa com o nome do modelo (ex: "Civic 2.0", "Gol G5", "Corolla Cross")
    if (
      termoLimpo === modeloLimpo ||
      termoLimpo.startsWith(`${modeloLimpo} `) ||
      termoLimpo.startsWith(`${modeloLimpo}-`) ||
      palavrasTermo[0] === modeloLimpo
    ) {
      return {
        marca: item.marca,
        modeloNome: item.modelo,
        termoDetectado: item.modelo,
        confianca: 'alta',
      };
    }
  }

  // 3. Busca nas variações conhecidas (ex: "TCross", "Titan 160", "Sandero Stepway", "S10", "Saveiro Cross")
  for (const item of CATALOGO_VEICULOS) {
    if (item.variacoes && item.variacoes.length > 0) {
      for (const v of item.variacoes) {
        const variacaoLimpa = normalizarTexto(v);
        if (
          termoLimpo === variacaoLimpa ||
          termoLimpo.startsWith(`${variacaoLimpa} `) ||
          termoLimpo.startsWith(`${variacaoLimpa}-`) ||
          termoLimpo.includes(` ${variacaoLimpa} `)
        ) {
          return {
            marca: item.marca,
            modeloNome: item.modelo,
            termoDetectado: v,
            confianca: 'alta',
          };
        }
      }
    }
  }

  // 4. Busca por correspondência parcial de palavras distintas com comprimento >= 3
  for (const item of CATALOGO_VEICULOS) {
    const modeloLimpo = normalizarTexto(item.modelo);
    if (modeloLimpo.length >= 3 && palavrasTermo.includes(modeloLimpo)) {
      return {
        marca: item.marca,
        modeloNome: item.modelo,
        termoDetectado: item.modelo,
        confianca: 'media',
      };
    }
  }

  return null;
}

/**
 * Retorna sugestões de modelos para preenchimento com datalist ou autocomplete
 */
export function buscarSugestoesModelos(termo: string, limite: number = 10): Array<{ modelo: string; marca: string }> {
  if (!termo || termo.trim().length < 2) {
    // Retorna os mais populares se não houver filtro
    return CATALOGO_VEICULOS.slice(0, limite).map((c) => ({
      modelo: c.modelo,
      marca: c.marca,
    }));
  }

  const termoLimpo = normalizarTexto(termo);
  const resultados: Array<{ modelo: string; marca: string }> = [];
  const jaAdicionados = new Set<string>();

  for (const item of CATALOGO_VEICULOS) {
    const modeloLimpo = normalizarTexto(item.modelo);
    const marcaLimpa = normalizarTexto(item.marca);

    const correspondeModelo = modeloLimpo.includes(termoLimpo);
    const correspondeMarca = marcaLimpa.includes(termoLimpo);
    const correspondeVariacao = item.variacoes?.some((v) => normalizarTexto(v).includes(termoLimpo));

    if (correspondeModelo || correspondeMarca || correspondeVariacao) {
      const chave = `${item.modelo}|${item.marca}`;
      if (!jaAdicionados.has(chave)) {
        jaAdicionados.add(chave);
        resultados.push({
          modelo: item.modelo,
          marca: item.marca,
        });
        if (resultados.length >= limite) break;
      }
    }
  }

  return resultados;
}
