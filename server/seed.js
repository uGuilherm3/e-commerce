// Popula o banco local com dados de teste. Roda a cada start, mas só cria
// o que ainda não existe — dados editados pelo admin não são sobrescritos.
import Parse from 'parse/node';
import {
  APP_ID, JAVASCRIPT_KEY, MASTER_KEY, SERVER_URL, ADMIN_EMAIL, ADMIN_PASSWORD,
} from './config.js';

Parse.initialize(APP_ID, JAVASCRIPT_KEY, MASTER_KEY);
Parse.serverURL = SERVER_URL;

const IMG = {
  perfume: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop',
  vela: 'https://images.unsplash.com/photo-1602874801006-e26b53f9e8a0?q=80&w=800&auto=format&fit=crop',
  sabonete: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?q=80&w=800&auto=format&fit=crop',
  hidratante: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop',
  difusor: 'https://images.unsplash.com/photo-1519669556878-63bdad8a1a49?q=80&w=800&auto=format&fit=crop',
  kit: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop',
  banner: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
  look: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1600&auto=format&fit=crop',
};

const PRODUCTS = [
  {
    name: 'Perfume Essência Floral 100ml', price: 189.9, stock: 12, category: 'Perfumaria',
    categories: ['Perfumaria', 'Lançamentos'], imageUrl: IMG.perfume, salesCount: 42,
    description: 'Notas de jasmim e baunilha.\nFixação de até 8 horas.',
    variants: ['50ml', '100ml'], hasDetails: true, isInfoBannerProduct: true,
  },
  {
    name: 'Vela Aromática Lavanda', price: 79.9, stock: 25, category: 'Casa',
    categories: ['Casa'], imageUrl: IMG.vela, salesCount: 87,
    description: 'Cera vegetal, 40 horas de queima.', variants: [], hasDetails: true,
    discountPrice: 59.9, discountEndsAt: new Date(Date.now() + 7 * 864e5),
  },
  {
    name: 'Sabonete Artesanal de Carvão', price: 24.9, stock: 60, category: 'Banho',
    categories: ['Banho'], imageUrl: IMG.sabonete, salesCount: 130,
    description: 'Esfoliação suave e limpeza profunda.', variants: [],
  },
  {
    name: 'Hidratante Corporal Karité', price: 64.9, stock: 18, category: 'Corpo',
    categories: ['Corpo'], imageUrl: IMG.hidratante, salesCount: 55,
    description: 'Manteiga de karité e óleo de amêndoas.', variants: ['200ml', '400ml'],
    hasDetails: true, isInfoBannerProduct: true,
  },
  {
    name: 'Difusor de Ambiente Bergamota', price: 119.9, stock: 0, category: 'Casa',
    categories: ['Casa'], imageUrl: IMG.difusor, salesCount: 21,
    description: 'Produto esgotado — bom para testar o estado "sem estoque".',
    variants: [],
  },
  {
    name: 'Kit Presente Flor e Sol', price: 249.9, stock: 6, category: 'Kits',
    categories: ['Kits', 'Lançamentos'], imageUrl: IMG.kit, salesCount: 9,
    description: 'Perfume + vela + sabonete em caixa presenteável.', variants: [],
    hasDetails: true,
  },
];

async function seedAdmin() {
  const existing = await new Parse.Query(Parse.User)
    .equalTo('email', ADMIN_EMAIL)
    .first({ useMasterKey: true });
  if (existing) return existing;

  const user = new Parse.User();
  user.set('username', ADMIN_EMAIL);
  user.set('email', ADMIN_EMAIL);
  user.set('password', ADMIN_PASSWORD);
  user.set('name', 'Admin Local');
  user.set('phone', '11999999999');
  await user.signUp();
  await Parse.User.logOut();
  console.log(`  Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  return user;
}

async function seedProducts() {
  const count = await new Parse.Query('Product').count({ useMasterKey: true });
  if (count > 0) return new Parse.Query('Product').find({ useMasterKey: true });

  const Product = Parse.Object.extend('Product');
  const objects = PRODUCTS.map((data) => {
    const p = new Product();
    Object.entries(data).forEach(([k, v]) => p.set(k, v));
    return p;
  });
  await Parse.Object.saveAll(objects, { useMasterKey: true });
  console.log(`  ${objects.length} produtos criados`);
  return objects;
}

async function seedReviews(products) {
  const count = await new Parse.Query('Review').count({ useMasterKey: true });
  if (count > 0) return;

  const Review = Parse.Object.extend('Review');
  const samples = [
    { rating: 5, comment: 'Cheiro maravilhoso, fixação ótima!', userName: 'Marina' },
    { rating: 4, comment: 'Gostei bastante, entrega rápida.', userName: 'Rafael' },
    { rating: 5, comment: 'Comprei de novo, vale cada centavo.', userName: 'Camila' },
  ];
  const reviews = samples.map((data, i) => {
    const r = new Review();
    Object.entries(data).forEach(([k, v]) => r.set(k, v));
    r.set('product', products[i % products.length]);
    return r;
  });
  await Parse.Object.saveAll(reviews, { useMasterKey: true });
  console.log(`  ${reviews.length} avaliações criadas`);
}

async function seedSettings(products) {
  const count = await new Parse.Query('StoreSettings').count({ useMasterKey: true });
  if (count > 0) return;

  const StoreSettings = Parse.Object.extend('StoreSettings');
  const s = new StoreSettings();
  s.set('banners', [
    {
      imageUrl: IMG.banner, tag: 'Novidades', title: 'Coleção Essência',
      desc: 'Descubra o frescor.', btn: 'Descobrir Agora', target: 'lancamentos',
    },
    {
      imageUrl: IMG.look, tag: 'Outono', title: 'Aromas de Estação',
      desc: 'Seleção quente para dias frios.', btn: 'Ver Coleção', target: 'lancamentos',
    },
  ]);
  s.set('loginBanners', [{ imageUrl: IMG.look }]);
  s.set('infoBannerActive', true);
  s.set('infoBannerTitle', 'Coleção de Outono');
  s.set('infoBannerDesc', 'Não perca nossa coleção exclusiva por tempo limitado.');
  s.set('infoBannerBtn', 'Explorar');
  s.set('infoBannerImageUrl', IMG.look);
  s.set('promoBannerTitle', 'Ofertas Especiais');
  s.set('promoBannerDesc', 'Uma seleção exclusiva de peças com condições únicas.');
  s.set('promoBannerImageUrl', IMG.banner);
  s.set('thirdBannerActive', true);
  s.set('thirdBannerTitle', 'Feito à mão');
  s.set('thirdBannerDesc', 'Produção artesanal em pequenos lotes.');
  s.set('thirdBannerBtn', 'Conhecer');
  s.set('thirdBannerBtnLink', '#');
  s.set('thirdBannerImageUrl', IMG.kit);
  s.set('lookImageUrl', IMG.look);
  s.set('lookItems', [
    { productId: products[0].id, x: 30, y: 40, label: PRODUCTS[0].name },
    { productId: products[1].id, x: 65, y: 70, label: PRODUCTS[1].name },
  ]);
  await s.save(null, { useMasterKey: true });
  console.log('  StoreSettings criado');
}

export async function seed() {
  try {
    await seedAdmin();
    const products = await seedProducts();
    await seedReviews(products);
    await seedSettings(products);
    console.log('  Seed pronto.\n');
  } catch (error) {
    console.error('  Falha no seed:', error.message);
  }
}
