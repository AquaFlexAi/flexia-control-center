
import { Kafka, Producer, Consumer, logLevel, Admin } from 'kafkajs';

// Configuration
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'flexia-control-center';

const kafka = new Kafka({
    clientId: CLIENT_ID,
    brokers: KAFKA_BROKERS,
    logLevel: logLevel.ERROR, // Reduce noise
});

export const KAFKA_CONFIG = {
    sessionTimeout: 30000,
    heartbeatInterval: 10000,
    retry: {
        initialRetryTime: 300,
        retries: 8
    }
};

let producer: Producer | null = null;
let consumer: Consumer | null = null;
let admin: Admin | null = null;

export async function getProducer(): Promise<Producer> {
    if (!producer) {
        producer = kafka.producer();
        await producer.connect();
        console.log('[Kafka] Producer connected');
    }
    return producer;
}

export async function getConsumer(groupId: string): Promise<Consumer> {
    if (!consumer) {
        consumer = kafka.consumer({ groupId });
        await consumer.connect();
        console.log(`[Kafka] Consumer connected (Group: ${groupId})`);
    }
    return consumer;
}

export async function getAdmin(): Promise<Admin> {
    if (!admin) {
        admin = kafka.admin();
        await admin.connect();
        console.log('[Kafka] Admin connected');
    }
    return admin;
}

export async function ensureTopic(topic: string, numPartitions: number = 1) {
    try {
        const admin = await getAdmin();
        const topics = await admin.listTopics();

        if (!topics.includes(topic)) {
            console.log(`[Kafka] Creating topic: ${topic}`);
            await admin.createTopics({
                topics: [{
                    topic,
                    numPartitions,
                    replicationFactor: 1
                }]
            });
            console.log(`[Kafka] Topic created: ${topic}`);
        }
    } catch (error) {
        console.error(`[Kafka] Failed to ensure topic ${topic}:`, error);
    }
}

export async function publishEvent(topic: string, event: any) {
    try {
        const p = await getProducer();
        await p.send({
            topic,
            messages: [
                { value: JSON.stringify(event) }
            ],
        });
        // console.log(`[Kafka] Published to ${topic}:`, event);
    } catch (error) {
        console.error(`[Kafka] Failed to publish to ${topic}:`, error);
    }
}

export async function subscribeToTopic(topic: string, handler: (message: any) => Promise<void>, groupId: string = 'flexia-group') {
    const c = await getConsumer(groupId);
    await c.subscribe({ topic, fromBeginning: false });

    await c.run({
        ...KAFKA_CONFIG,
        eachMessage: async ({ topic, partition, message }) => {
            const value = message.value?.toString();
            if (value) {
                try {
                    const json = JSON.parse(value);
                    await handler(json);
                } catch (e) {
                    console.error('[Kafka] Error parsing message:', e);
                }
            }
        },
    });
}
