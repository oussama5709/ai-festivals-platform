import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_EVENTS = [
  { title: 'NeurIPS 2025', description: 'Premier ML research conference.', date: new Date('2025-12-07'), endDate: new Date('2025-12-13'), location: 'New Orleans, USA', isOnline: false, url: 'https://neurips.cc/Conferences/2025', source: 'neurips.cc', region: 'americas', regionArabic: 'الأمريكتان', category: 'conference', qualityScore: 0.95, scrapedAt: new Date() },
  { title: 'ICML 2025', description: 'International Conference on Machine Learning.', date: new Date('2025-07-13'), endDate: new Date('2025-07-19'), location: 'Vienna, Austria', isOnline: false, url: 'https://icml.cc/Conferences/2025', source: 'icml.cc', region: 'europe', regionArabic: 'أوروبا', category: 'conference', qualityScore: 0.92, scrapedAt: new Date() },
  { title: 'AI Summit Dubai 2025', description: 'Leading AI business summit in the Gulf.', date: new Date('2025-10-14'), endDate: new Date('2025-10-15'), location: 'Dubai, UAE', isOnline: false, url: 'https://dubai.theaisummit.com/2025', source: 'theaisummit.com', region: 'middle-east', regionArabic: 'الشرق الأوسط', category: 'summit', qualityScore: 0.87, scrapedAt: new Date() },
  { title: 'ICLR 2025', description: 'International Conference on Learning Representations.', date: new Date('2025-04-24'), endDate: new Date('2025-04-28'), location: 'Singapore', isOnline: false, url: 'https://iclr.cc/Conferences/2025', source: 'iclr.cc', region: 'asia', regionArabic: 'آسيا', category: 'conference', qualityScore: 0.93, scrapedAt: new Date() },
  { title: 'CVPR 2025', description: 'Top venue for computer vision research.', date: new Date('2025-06-10'), endDate: new Date('2025-06-17'), location: 'Nashville, USA', isOnline: false, url: 'https://cvpr.thecvf.com/Conferences/2025', source: 'thecvf.com', region: 'americas', regionArabic: 'الأمريكتان', category: 'conference', qualityScore: 0.91, scrapedAt: new Date() },
  { title: 'Global AI Summit Riyadh', description: "Saudi Arabia's flagship AI event.", date: new Date('2025-09-08'), endDate: new Date('2025-09-10'), location: 'Riyadh, Saudi Arabia', isOnline: false, url: 'https://globalaisummit.com/riyadh-2025', source: 'globalaisummit.com', region: 'middle-east', regionArabic: 'الشرق الأوسط', category: 'summit', qualityScore: 0.89, scrapedAt: new Date() },
  { title: 'Deep Learning Indaba 2025', description: 'Strengthening African ML community.', date: new Date('2025-08-04'), endDate: new Date('2025-08-09'), location: 'Accra, Ghana', isOnline: false, url: 'https://deeplearningindaba.com/2025', source: 'deeplearningindaba.com', region: 'africa', regionArabic: 'أفريقيا', category: 'workshop', qualityScore: 0.85, scrapedAt: new Date() },
  { title: 'AI World Congress London', description: 'Premier AI conference in Europe.', date: new Date('2025-10-22'), endDate: new Date('2025-10-23'), location: 'London, UK', isOnline: false, url: 'https://aiworldcongress.com/london-2025', source: 'aiworldcongress.com', region: 'europe', regionArabic: 'أوروبا', category: 'conference', qualityScore: 0.84, scrapedAt: new Date() },
  { title: 'ACL 2025', description: 'Premier NLP conference.', date: new Date('2025-07-27'), endDate: new Date('2025-08-01'), location: 'Vienna, Austria', isOnline: false, url: 'https://2025.aclweb.org', source: 'aclweb.org', region: 'europe', regionArabic: 'أوروبا', category: 'conference', qualityScore: 0.91, scrapedAt: new Date() },
  { title: 'GITEX AI & Technology Week 2025', description: "World's largest tech event with major AI pavilion.", date: new Date('2025-10-13'), endDate: new Date('2025-10-17'), location: 'Dubai, UAE', isOnline: false, url: 'https://gitex.com/gitex-global/2025', source: 'gitex.com', region: 'middle-east', regionArabic: 'الشرق الأوسط', category: 'conference', qualityScore: 0.88, scrapedAt: new Date() },
  { title: 'KDD 2025', description: 'ACM SIGKDD Conference on Knowledge Discovery.', date: new Date('2025-08-03'), endDate: new Date('2025-08-07'), location: 'Washington D.C., USA', isOnline: false, url: 'https://kdd2025.kdd.org', source: 'kdd.org', region: 'americas', regionArabic: 'الأمريكتان', category: 'conference', qualityScore: 0.89, scrapedAt: new Date() },
  { title: 'ECCV 2025', description: 'European Conference on Computer Vision.', date: new Date('2025-09-29'), endDate: new Date('2025-10-04'), location: 'Glasgow, UK', isOnline: false, url: 'https://eccv2025.ecva.net', source: 'ecva.net', region: 'europe', regionArabic: 'أوروبا', category: 'conference', qualityScore: 0.91, scrapedAt: new Date() },
  { title: 'NeurIPS 2025 Workshop: ML for Audio', description: 'NeurIPS satellite workshop on audio understanding.', date: new Date('2025-12-14'), endDate: new Date('2025-12-14'), location: 'New Orleans, USA', isOnline: false, url: 'https://neurips.cc/Conferences/2025/workshops/ml-audio', source: 'neurips.cc', region: 'americas', regionArabic: 'الأمريكتان', category: 'workshop', qualityScore: 0.83, scrapedAt: new Date() },
  { title: 'AI for Good Global Summit', description: 'UN platform for AI towards Sustainable Development Goals.', date: new Date('2025-07-08'), endDate: new Date('2025-07-10'), location: 'Geneva, Switzerland', isOnline: true, url: 'https://aiforgood.itu.int/summit/2025', source: 'itu.int', region: 'europe', regionArabic: 'أوروبا', category: 'summit', qualityScore: 0.88, scrapedAt: new Date() },
  { title: 'Tunis Tech Meetup: Intro to AI', description: 'Beginner-friendly AI meetup for Tunisian tech community.', date: new Date('2025-06-28'), endDate: new Date('2025-06-28'), location: 'Tunis, Tunisia', isOnline: false, url: 'https://www.meetup.com/tunistech/events/ai-intro-june-2025', source: 'meetup.com', region: 'africa', regionArabic: 'أفريقيا', category: 'meetup', qualityScore: 0.66, scrapedAt: new Date() },
  { title: 'Cairo AI Hackathon', description: '72-hour hackathon for Arabic NLP and computer vision.', date: new Date('2025-07-25'), endDate: new Date('2025-07-27'), location: 'Cairo, Egypt', isOnline: false, url: 'https://cairoaihack.org/2025', source: 'cairoaihack.org', region: 'africa', regionArabic: 'أفريقيا', category: 'hackathon', qualityScore: 0.75, scrapedAt: new Date() },
  { title: 'Film AI Festival Berlin', description: 'Festival celebrating AI-generated film and creative AI art.', date: new Date('2025-09-15'), endDate: new Date('2025-09-17'), location: 'Berlin, Germany', isOnline: false, url: 'https://filmaisfestival.berlin/2025', source: 'filmaisfestival.berlin', region: 'europe', regionArabic: 'أوروبا', category: 'conference', qualityScore: 0.81, scrapedAt: new Date() },
];

export async function autoSeed(): Promise<void> {
  try {
    const count = await prisma.event.count();
    if (count > 0) {
      console.log(`[autoSeed] DB already has ${count} events — skipping.`);
      return;
    }

    console.log('[autoSeed] DB empty — seeding...');

    for (const event of SEED_EVENTS) {
      await prisma.event.upsert({
        where: { url: event.url },
        update: {},
        create: event,
      });
    }

    await prisma.scrapeRun.upsert({
      where: { apifyRunId: 'auto-seed-001' },
      update: {},
      create: {
        apifyRunId: 'auto-seed-001',
        status: 'succeeded',
        eventsFound: SEED_EVENTS.length,
        regions: JSON.stringify(['worldwide', 'middle-east', 'africa', 'europe', 'asia', 'americas']),
        startedAt: new Date(Date.now() - 60000),
        completedAt: new Date(),
        durationMs: 60000,
      },
    });

    console.log(`[autoSeed] Seeded ${SEED_EVENTS.length} events ✓`);
  } catch (err) {
    console.error('[autoSeed] Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}
