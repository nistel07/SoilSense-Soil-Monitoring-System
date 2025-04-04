//  // Save the latest moisture data
//       moistureData = moisture;
//       // Save the latest nitrogen data
//       nitrogenData = nitrogen;

//       // Save the latest phosphorus data
//       phosphorusData = phosphorus;
//       // Save the latest potassium data
//       potassiumData = potassium;
//       // Save the latest temperature data
//       temperatureData = temperature;
//       // Save the latest humidity data
//       humidityData = humidity;

//       const sdata = new SensorData({
//         moisture,
//         nitrogen,
//         phosphorus,
//         potassium,
//         temperature,
//         humidity,
//       });

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const SensorDataSchema = new Schema({
  moisture: { type: Number, required: true },
  nitrogen: { type: Number, required: true },
  phosphorus: { type: Number, required: true },
  potassium: { type: Number, required: true },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
}, {
  timestamps: true,
});
const SensorData = mongoose.model("SensorData", SensorDataSchema);
module.exports = SensorData;