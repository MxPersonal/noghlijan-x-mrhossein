/** @format */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const products = [
  {
    name: "بادی نوزادی سپیدار",
    slug: "seedar-newborn-bodysuit",
    description:
      "بادی آستین‌بلند از نخ پنبه لطیف با طرح برگ‌های سبز، یقه راحت و دکمه‌های فشاری برای تعویض سریع؛ مناسب پوست حساس نوزاد.",
    price: 520_000,
    imageUrl: "/images/catalog/seedar-bodysuit.webp",
    category: "بادی",
    ageGroup: "0-1 سال",
    gender: "یونیسکس",
    stock: 26,
  },
  {
    name: "کلاه بافتنی گوش‌دار ماه",
    slug: "moon-bear-knit-hat",
    description:
      "کلاه بافت نرم و گرم با گوش‌های گرد و گلدوزی ظریف ماه؛ سبک، بدون زبری و مناسب روزهای خنک نوزاد و نوپا.",
    price: 420_000,
    imageUrl: "/images/catalog/moon-bear-hat.webp",
    category: "کلاه",
    ageGroup: "0-2 سال",
    gender: "یونیسکس",
    stock: 30,
  },
  {
    name: "ست راحتی خرگوش مهتابی",
    slug: "moon-bunny-lounge-set",
    description:
      "ست دو تکه پنبه‌ای شامل بلوز آستین‌بلند و شلوار کمرکش با طرح خرگوش مهتابی؛ نرم و آزاد برای خواب و بازی روزانه.",
    price: 1_250_000,
    imageUrl: "/images/catalog/moon-bunny-lounge-set.webp",
    category: "ست",
    ageGroup: "1-3 سال",
    gender: "دخترانه",
    stock: 18,
  },
  {
    name: "جوراب سه‌تایی جنگل",
    slug: "forest-socks-three-pack",
    description:
      "پک سه جفت جوراب نخی در رنگ‌های کرم، سبزآبی و هلویی با طرح روباه، برگ و خرس؛ کش نرم آن روی پای کودک رد نمی‌اندازد.",
    price: 320_000,
    imageUrl: "/images/catalog/forest-socks-pack.webp",
    category: "جوراب",
    ageGroup: "1-4 سال",
    gender: "یونیسکس",
    stock: 42,
  },
  {
    name: "تی‌شرت رنگین‌کمان پاستلی",
    slug: "pastel-rainbow-tshirt",
    description:
      "تی‌شرت نخی سبک با یقه نرم و طرح رنگین‌کمان پاستلی؛ خنک، بادوام و مناسب بازی و استفاده روزمره کودک.",
    price: 590_000,
    imageUrl: "/images/catalog/pastel-rainbow-tshirt.webp",
    category: "تی‌شرت",
    ageGroup: "2-4 سال",
    gender: "یونیسکس",
    stock: 28,
  },
  {
    name: "پیراهن نخی شکوفه",
    slug: "blossom-cotton-dress",
    description:
      "پیراهن تابستانی از پارچه نخی تنفس‌پذیر با آستین‌های چین‌دار و نقش شکوفه‌های ظریف؛ سبک و راحت برای گردش و مهمانی.",
    price: 890_000,
    imageUrl: "/images/catalog/blossom-cotton-dress.webp",
    category: "پیراهن",
    ageGroup: "3-5 سال",
    gender: "دخترانه",
    stock: 16,
  },
  {
    name: "دامن چین‌دار پروانه",
    slug: "butterfly-pleated-skirt",
    description:
      "دامن مرجانی با چین‌های نرم، کمر کشی راحت و گلدوزی پروانه‌های کوچک؛ مناسب استایل شاد روزانه و دورهمی.",
    price: 650_000,
    imageUrl: "/images/catalog/butterfly-pleated-skirt.webp",
    category: "دامن",
    ageGroup: "3-6 سال",
    gender: "دخترانه",
    stock: 20,
  },
  {
    name: "شلوار کتان ماجراجو",
    slug: "adventurer-cotton-joggers",
    description:
      "شلوار کتان کشی با کمر بنددار، جیب‌های کاربردی و زانوی تقویت‌شده؛ مقاوم و راحت برای دویدن و بازی‌های پرتحرک.",
    price: 790_000,
    imageUrl: "/images/catalog/adventurer-joggers.webp",
    category: "شلوار",
    ageGroup: "4-6 سال",
    gender: "پسرانه",
    stock: 22,
  },
  {
    name: "کاپشن بارانی دریانورد",
    slug: "sailor-rain-jacket",
    description:
      "کاپشن سبک ضدآب با کلاه، آستر خردلی، زیپ روان و نوارهای بازتابنده؛ مناسب باران و باد در رفت‌وآمدهای روزانه.",
    price: 1_450_000,
    imageUrl: "/images/catalog/sailor-rain-jacket.webp",
    category: "کاپشن",
    ageGroup: "4-8 سال",
    gender: "پسرانه",
    stock: 14,
  },
  {
    name: "هودی نرم ابر و باران",
    slug: "cloud-rain-soft-hoodie",
    description:
      "هودی دورس لطیف با کلاه آستردار، جیب کانگورویی و طرح مینیمال ابر و قطره‌های رنگی؛ گرم و راحت برای فصل خنک.",
    price: 1_080_000,
    imageUrl: "/images/catalog/cloud-rain-hoodie.webp",
    category: "هودی",
    ageGroup: "5-7 سال",
    gender: "یونیسکس",
    stock: 19,
  },
  {
    name: "ست ورزشی قهرمان کوچک",
    slug: "little-champion-sport-set",
    description:
      "ست ورزشی سبک شامل تی‌شرت تنفس‌پذیر و شلوارک کمرکش؛ با آزادی حرکت مناسب برای ورزش، بازی و فعالیت روزانه.",
    price: 980_000,
    imageUrl: "/images/catalog/little-champion-sport-set.webp",
    category: "ست",
    ageGroup: "5-8 سال",
    gender: "پسرانه",
    stock: 17,
  },
  {
    name: "پیش‌بند ضدآب باغچه",
    slug: "garden-waterproof-bib",
    description:
      "پیش‌بند نرم و ضدآب با جیب جمع‌کننده غذا و طرح هویج و کفشدوزک؛ به‌راحتی تمیز می‌شود و دور گردن قابل تنظیم است.",
    price: 280_000,
    imageUrl: "/images/catalog/garden-waterproof-bib.webp",
    category: "اکسسوری",
    ageGroup: "0-2 سال",
    gender: "یونیسکس",
    stock: 36,
  },
] as const;

type CatalogDetails = {
  tags: readonly string[];
  labels: readonly string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  primaryAlt: string;
  wornAlt: string;
};

const catalogDetails: Record<string, CatalogDetails> = {
  "seedar-newborn-bodysuit": {
    tags: ["نوزادی", "نخی", "پوست حساس", "چهارفصل"],
    labels: ["جدید", "لطیف"],
    seoTitle: "خرید بادی نوزادی نخی سپیدار",
    seoDescription: "بادی آستین‌بلند نوزادی سپیدار از نخ پنبه لطیف، مناسب پوست حساس با دکمه فشاری و طرح برگ؛ همراه تصویر محصول و تن‌خور.",
    seoKeywords: "بادی نوزادی, لباس نوزاد, بادی نخی, لباس پوست حساس",
    primaryAlt: "بادی نوزادی سپیدار با طرح برگ سبز",
    wornAlt: "تن‌خور بادی نوزادی سپیدار روی کودک",
  },
  "moon-bear-knit-hat": {
    tags: ["نوزادی", "زمستانی", "بافتنی", "گرم"],
    labels: ["جدید"],
    seoTitle: "خرید کلاه بافتنی گوش‌دار نوزاد",
    seoDescription: "کلاه بافتنی نرم و گرم گوش‌دار برای نوزاد و نوپا، بدون زبری و مناسب روزهای خنک؛ مشاهده جزئیات و تصویر تن‌خور.",
    seoKeywords: "کلاه نوزادی, کلاه بافتنی کودک, کلاه گوش دار, لباس زمستانی کودک",
    primaryAlt: "کلاه بافتنی کرم گوش‌دار با گلدوزی ماه",
    wornAlt: "تن‌خور کلاه بافتنی گوش‌دار روی کودک",
  },
  "moon-bunny-lounge-set": {
    tags: ["راحتی", "پنبه‌ای", "خواب", "دو تکه"],
    labels: ["محبوب"],
    seoTitle: "خرید ست راحتی پنبه‌ای کودک خرگوش مهتابی",
    seoDescription: "ست راحتی دو تکه پنبه‌ای کودک با طرح خرگوش، بلوز آستین‌بلند و شلوار کمرکش؛ نرم و آزاد برای خواب و بازی.",
    seoKeywords: "ست راحتی کودک, لباس خواب کودک, ست پنبه ای, لباس دخترانه",
    primaryAlt: "ست راحتی دو تکه کودک با طرح خرگوش مهتابی",
    wornAlt: "تن‌خور ست راحتی خرگوش مهتابی روی کودک",
  },
  "forest-socks-three-pack": {
    tags: ["جوراب نخی", "پک سه‌تایی", "روزمره"],
    labels: ["پرفروش"],
    seoTitle: "خرید پک سه‌تایی جوراب نخی کودک جنگل",
    seoDescription: "سه جفت جوراب نخی کودک با طرح جنگل و کش نرم در رنگ‌های کرم، سبزآبی و هلویی؛ مناسب استفاده روزمره.",
    seoKeywords: "جوراب کودک, جوراب نخی, پک جوراب بچه گانه, جوراب طرح دار",
    primaryAlt: "پک سه‌تایی جوراب نخی کودک با طرح جنگل",
    wornAlt: "نمای تن‌خور سه مدل جوراب نخی کودک جنگل",
  },
  "pastel-rainbow-tshirt": {
    tags: ["نخی", "تابستانی", "روزمره", "رنگین‌کمان"],
    labels: ["جدید"],
    seoTitle: "خرید تی‌شرت نخی کودک رنگین‌کمان پاستلی",
    seoDescription: "تی‌شرت نخی سبک و خنک کودک با طرح رنگین‌کمان پاستلی، یقه نرم و دوخت بادوام؛ مناسب بازی و استفاده روزمره.",
    seoKeywords: "تیشرت کودک, لباس نخی کودک, تیشرت تابستانی, لباس یونیسکس کودک",
    primaryAlt: "تی‌شرت نخی کودک با طرح رنگین‌کمان پاستلی",
    wornAlt: "تن‌خور تی‌شرت رنگین‌کمان پاستلی روی کودک",
  },
  "blossom-cotton-dress": {
    tags: ["نخی", "تابستانی", "مهمانی", "گل‌دار"],
    labels: ["ویژه"],
    seoTitle: "خرید پیراهن نخی دخترانه شکوفه",
    seoDescription: "پیراهن نخی تابستانی دخترانه با نقش شکوفه و آستین چین‌دار؛ سبک و تنفس‌پذیر برای گردش و مهمانی.",
    seoKeywords: "پیراهن دخترانه, لباس نخی دخترانه, پیراهن تابستانی کودک, لباس گل دار",
    primaryAlt: "پیراهن نخی دخترانه با نقش شکوفه",
    wornAlt: "تن‌خور پیراهن نخی شکوفه روی کودک",
  },
  "butterfly-pleated-skirt": {
    tags: ["چین‌دار", "مهمانی", "کمرکشی"],
    labels: ["جدید"],
    seoTitle: "خرید دامن چین‌دار دخترانه پروانه",
    seoDescription: "دامن مرجانی چین‌دار دخترانه با کمر کشی و گلدوزی پروانه؛ راحت و شاد برای استایل روزانه و دورهمی.",
    seoKeywords: "دامن دخترانه, دامن چین دار کودک, دامن کمر کشی, لباس مهمانی دخترانه",
    primaryAlt: "دامن مرجانی چین‌دار دخترانه با طرح پروانه",
    wornAlt: "تن‌خور دامن چین‌دار پروانه روی کودک",
  },
  "adventurer-cotton-joggers": {
    tags: ["کتان", "روزمره", "بازی", "کمرکشی"],
    labels: ["بادوام"],
    seoTitle: "خرید شلوار کتان پسرانه ماجراجو",
    seoDescription: "شلوار کتان کشی پسرانه با جیب کاربردی، کمر بنددار و زانوی تقویت‌شده؛ راحت و مقاوم برای دویدن و بازی.",
    seoKeywords: "شلوار پسرانه, شلوار کتان کودک, شلوار بازی کودک, شلوار کمر کشی",
    primaryAlt: "شلوار کتان پسرانه ماجراجو با جیب کاربردی",
    wornAlt: "تن‌خور شلوار کتان ماجراجو روی کودک",
  },
  "sailor-rain-jacket": {
    tags: ["ضدآب", "بارانی", "کلاه‌دار", "پاییزه"],
    labels: ["ویژه"],
    seoTitle: "خرید کاپشن بارانی ضدآب کودک دریانورد",
    seoDescription: "کاپشن بارانی ضدآب کودک با کلاه، آستر خردلی و نوار بازتابنده؛ سبک و مناسب باران و باد روزهای خنک.",
    seoKeywords: "کاپشن کودک, بارانی پسرانه, کاپشن ضدآب, لباس پاییزه کودک",
    primaryAlt: "کاپشن بارانی سرمه‌ای کودک با آستر خردلی",
    wornAlt: "تن‌خور کاپشن بارانی دریانورد روی کودک",
  },
  "cloud-rain-soft-hoodie": {
    tags: ["دورس", "گرم", "پاییزه", "کلاه‌دار"],
    labels: ["پرفروش"],
    seoTitle: "خرید هودی دورس کودک ابر و باران",
    seoDescription: "هودی دورس لطیف کودک با کلاه آستردار، جیب کانگورویی و طرح ابر و قطره؛ گرم و راحت برای فصل خنک.",
    seoKeywords: "هودی کودک, هودی دورس, لباس پاییزه کودک, هودی کلاه دار",
    primaryAlt: "هودی سبز کودک با طرح ابر و قطره‌های رنگی",
    wornAlt: "تن‌خور هودی نرم ابر و باران روی کودک",
  },
  "little-champion-sport-set": {
    tags: ["ورزشی", "تنفس‌پذیر", "دو تکه", "بازی"],
    labels: ["محبوب"],
    seoTitle: "خرید ست ورزشی پسرانه قهرمان کوچک",
    seoDescription: "ست ورزشی سبک پسرانه شامل تی‌شرت تنفس‌پذیر و شلوارک کمرکش؛ مناسب ورزش، بازی و فعالیت روزانه.",
    seoKeywords: "ست ورزشی کودک, لباس ورزشی پسرانه, تیشرت و شلوارک, لباس بازی کودک",
    primaryAlt: "ست ورزشی نارنجی و خاکستری کودک",
    wornAlt: "تن‌خور ست ورزشی قهرمان کوچک روی کودک",
  },
  "garden-waterproof-bib": {
    tags: ["نوزادی", "ضدآب", "غذاخوری", "قابل شست‌وشو"],
    labels: ["کاربردی"],
    seoTitle: "خرید پیش‌بند ضدآب کودک باغچه",
    seoDescription: "پیش‌بند نرم و ضدآب کودک با جیب جمع‌کننده غذا، دور گردن قابل تنظیم و طرح باغچه؛ قابل شست‌وشو و تمیزکردن آسان.",
    seoKeywords: "پیشبند کودک, پیشبند ضدآب, پیشبند غذاخوری, اکسسوری نوزاد",
    primaryAlt: "پیش‌بند ضدآب کودک با طرح هویج و کفشدوزک",
    wornAlt: "تن‌خور پیش‌بند ضدآب باغچه روی کودک",
  },
};

function termConnections(names: readonly string[]) {
  return names.map((name) => ({ where: { name }, create: { name } }));
}

async function main() {
  const catalogSlugs = products.map(({ slug }) => slug);

  await prisma.$transaction(async (tx) => {
    await tx.product.updateMany({
      where: {
        isActive: true,
        slug: { notIn: catalogSlugs },
      },
      data: { isActive: false },
    });

    for (const product of products) {
      const details = catalogDetails[product.slug];
      const wornImageUrl = product.imageUrl.replace(/\.webp$/, "-worn.webp");
      const images = [
        { url: product.imageUrl, altText: details.primaryAlt, sortOrder: 0 },
        { url: wornImageUrl, altText: details.wornAlt, sortOrder: 1 },
      ];
      const tagConnections = termConnections(details.tags);
      const labelConnections = termConnections(details.labels);

      await tx.product.upsert({
        where: { slug: product.slug },
        create: {
          ...product,
          isActive: true,
          seoTitle: details.seoTitle,
          seoDescription: details.seoDescription,
          seoKeywords: details.seoKeywords,
          images: { create: images },
          tags: { connectOrCreate: tagConnections },
          labels: { connectOrCreate: labelConnections },
        },
        update: {
          ...product,
          isActive: true,
          seoTitle: details.seoTitle,
          seoDescription: details.seoDescription,
          seoKeywords: details.seoKeywords,
          images: { deleteMany: {}, create: images },
          tags: { set: [], connectOrCreate: tagConnections },
          labels: { set: [], connectOrCreate: labelConnections },
        },
      });
    }
  });

  console.log(`Activated ${products.length} catalog products; previous products were archived`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
