import * as tf from "@tensorflow/tfjs";

interface SchedulePreference {
  dayOfWeek: number;
  hourOfDay: number;
  weight: number;
}

export class SchedulingAI {
  private model: tf.Sequential;
  private preferences: SchedulePreference[] = [];

  constructor() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 32, activation: "relu", inputShape: [3] }),
        tf.layers.dense({ units: 16, activation: "relu" }),
        tf.layers.dense({ units: 1, activation: "sigmoid" }),
      ],
    });

    this.model.compile({
      optimizer: tf.train.adam(0.01),
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });
  }

  async trainOnPreferences(
    preferences: SchedulePreference[],
    epochs: number = 50
  ) {
    this.preferences = preferences;

    const trainingData = tf.tensor2d(
      preferences.map(p => [p.dayOfWeek / 7, p.hourOfDay / 24, p.weight])
    );

    const labels = tf.tensor2d(
      preferences.map(p => [p.weight > 0.5 ? 1 : 0])
    );

    await this.model.fit(trainingData, labels, {
      epochs,
      batchSize: 32,
      shuffle: true,
    });

    trainingData.dispose();
    labels.dispose();
  }

  predictTimeSlotScore(dayOfWeek: number, hourOfDay: number): number {
    const input = tf.tensor2d([[dayOfWeek / 7, hourOfDay / 24, 1]]);
    const prediction = this.model.predict(input) as tf.Tensor;
    const score = prediction.dataSync()[0];
    
    input.dispose();
    prediction.dispose();
    
    return score;
  }

  suggestOptimalSlots(
    availableSlots: Array<{ dayOfWeek: number; hourOfDay: number }>,
    count: number = 5
  ): Array<{ dayOfWeek: number; hourOfDay: number; score: number }> {
    const scoredSlots = availableSlots.map(slot => ({
      ...slot,
      score: this.predictTimeSlotScore(slot.dayOfWeek, slot.hourOfDay),
    }));

    return scoredSlots
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  addPreference(preference: SchedulePreference) {
    this.preferences.push(preference);
    this.trainOnPreferences(this.preferences);
  }

  getCurrentPreferences(): SchedulePreference[] {
    return [...this.preferences];
  }
}

export const schedulingAI = new SchedulingAI();
