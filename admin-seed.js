// admin-seed.js v6 — versioned reset (preserves edits between loads)
const _V=6;
const _stored=JSON.parse(localStorage.getItem('lp_cms_data')||'{}');
if((_stored._version||0)>=_V){} else {

const T='https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=2000';
const CV='https://res.cloudinary.com/dfstyia4c/video/upload/q_auto:eco,f_auto,w_600,c_fill,ar_9:16,br_800k/';
const CI='https://res.cloudinary.com/dfstyia4c/image/upload/';
const U='HIGH QUALITY UGC ADS',E='ENTERTAINMENT & EVENTS',FA='FASHION & JEWELS',SP='SPORTS & ACTIVEWEAR',FB='FOOD & BEVERAGE',RE='REAL ESTATE & INTERIORS & ARCHITECTURE',HB='HEALTHCARE & BEAUTY',ED='EDUCATION & CONSULTANCY',LI='LIFESTYLE & LUXURY',CO='CORPORATE';
const mk=(n,c,o={})=>{const reel=(u)=>!u?'':(u.startsWith('http')?u:CV+u);return{id:'p_'+n.replace(/[^a-z0-9]/gi,'_').toLowerCase(),name:n,desc:o.d||'',thumbnail:o.t||T,reel:reel(o.r),reel1:reel(o.r1),reel2:reel(o.r2),reel3:reel(o.r3),logo:o.l?CI+o.l:'',mood:o.m||'pureWhite',instagram:o.i||'',categories:c};};
const V={
  'LUCE & OMBRA':{r:'v1775387773/L_O_-_Compilation_zhxxhh.mp4',r1:'v1775387779/L_O_Kirti_Reel_3_new_grade_drqhmh.mp4',r2:'v1775387792/L_O_-_FEB_Compilation_Reel_2_xbnbyh.mp4',r3:'v1775626019/L_O_-_Coming_Soon_Final_hkejpx.mp4',i:'@luceandombra.eyewear',m:'darkEditorial',l:'Optichouse_Signature___Corporate_Logo_page-0001-1_i28nqi.png'},
  'FINCA RESTRO CAFE':{r:'https://res.cloudinary.com/dfstyia4c/video/upload/v1777794982/Finca_-_Model_Reel_Horizontal_CC_jv8538.mp4',i:'@finca.restrocafe',m:'goldenWarmth',l:'WhatsApp_Image_2023-08-19_at_12.37.24_PM_acnuea.png'},
  'KOA CAFE':{r:'v1775626654/KOA_-_Horizontal_a7illr.mp4',r1:'v1775390843/KOA_-_March_Compilation_klammi.mp4',r2:'v1775390851/KOA_-_Model_1_Glow_dspqoc.mp4',r3:'v1775388661/KOA_Cafe_-_March_Ultimate_Compilation_Reel_kue22s.mp4',i:'@koacafe.official',m:'goldenWarmth',l:'WhatsApp_Image_2023-08-19_at_12.37.24_PM_acnuea.png'},
  'FORTUNE INN PROMENADE':{r:'v1775559494/Fortune_Inn_Promenade_-_March_Desert_Reel_2_vs2xe8.mp4',r1:'v1775559587/FIP_-_FEB_Compilation_Reel_1_qqhbo5.mp4',r2:'v1775559490/FIP_-_3_friends_FINAL_qhnneg.mp4',r3:'v1775559486/FIP_-_Compilation_3_un77gd.mp4',i:'@fortuneinnpromenadevadodara',m:'goldenWarmth',l:'Suba_Logo_Original_-_Transparent_uv9wqy.png'},
  'DR. PRIYANKA':{r:'v1775561554/Dr._Priyanka_-_March_UEB_Horizontal_Reel_1_hzq046.mp4',r1:'v1775561547/DR_Priyanka_-_3_ew5p3r.mp4',r2:'v1775561591/DR_Priyanka_-_1_gl0y9p.mp4',r3:'v1775561547/DR_Priyanka_-_3_ew5p3r.mp4',l:'Vasu_Healthcare_Logo_pew3ww.png'},
  'THE DENTAL PROJECT':{r:'v1775558775/TDP_-_Script_2_xwnchw.mp4',r1:'v1775558786/TDP_-_Implant_Course_Highlight_plkl5j.mp4',r2:'v1775558802/The_Dental_Project_-_Dr._Nausheer_Testimonial_foaooe.mp4',r3:'v1775558770/TDP_-_Beyond_Implant_Placement_Reel_1_brdnke.mp4',i:'@thedental_project',l:'skaid-black_page-0001_wk4tyi.png'},
  'SIGNATURE EYEWEAR':{r:'v1775389629/Signature_feb_compilation_2_yxwc0v.mp4',r1:'v1775389631/Signature_Eyewear_-_March_B_-_Roll_Edit_Reel_1_rtbd30.mp4',r2:'v1775390387/Signature_Final_2_h6w6vf.mp4',r3:'v1775626958/Signature_feb_compilation_1_gbfp40.mp4',i:'@signature_eyewear_pvtltd',m:'darkEditorial',l:'Optichouse_Signature___Corporate_Logo_page-0001-1_i28nqi.png'},
  'OPTIC HOUSE':{r:'v1775389629/Signature_feb_compilation_2_yxwc0v.mp4',r1:'v1775389631/Signature_Eyewear_-_March_B_-_Roll_Edit_Reel_1_rtbd30.mp4',r2:'v1775390387/Signature_Final_2_h6w6vf.mp4',r3:'v1775626958/Signature_feb_compilation_1_gbfp40.mp4',i:'@optichouseofficial.in',l:'Optichouse_Signature___Corporate_Logo_page-0001-1_i28nqi.png'},
};
const RAW=[
  ['LIMITLESS X CLIENTS',[U]],['AMAR VSL 2.0',[U]],['BLACK BUNNY',[U]],['SIGNATURE EYEWEAR',[U,LI]],
  ['ESPI',[U,ED]],['BROOKFIELDZ',[U,RE]],['FINCA',[U]],['PACIFIC CONSULT',[U]],
  ['SADGURU INSTITUE',[U,ED]],['DECATHLON',[U,SP]],['KATHIAYAWADI VILLAGE',[U,FB]],
  ['TOTAL DENTAL PROJECT',[U]],['EASYDENT',[U,HB]],['KIDSTER',[U,LI]],['LEXUS',[U]],
  ['SIGMA UNIVERSITY',[U,ED]],['NABI SUTRA',[U]],['FIRANGI BURGER',[U,FB]],
  ['FUTURE LINK CONSULTANT',[U,ED]],['SHOURYA INTERNATIONAL',[U]],['BFF',[U,E]],
  ['BOLLYVERSE',[E]],['FREQUENCIES',[E,CO]],['ALEMBIC ART DISTRICT',[E,CO]],
  ['KALAKARS',[E]],['EO VADODARA',[E]],['TRIGGERS',[E]],['CREDI VADODARA',[E]],
  ['TIME FASHION WEEK',[E]],['B249',[E]],
  ['WOVENLOFT',[FA]],['LUCE & OMBRA',[FA]],['KASHI',[FA]],['JUHI LAKHANI',[FA]],
  ['AMREEN KHAN',[FA]],['GGJ',[FA]],['SKAID',[FA]],['GANGA SAREES',[FA]],
  ['WHITE LION JEWKS',[FA,LI]],['AMYA',[FA]],['MANDAP',[FA]],['YOGESHWAR ARTS',[FA]],
  ['VASPER',[FA]],['INSANITY',[FA]],['RK JEWELS',[FA]],
  ['GYMNATION',[SP]],['DECATHLON BARODA',[SP]],['LEOCOR',[SP]],['FITNESS TRACK',[SP]],
  ['T2 SPORTS',[SP]],['VADODARA COMBAT ASSOCIATION',[SP]],['VACO INDIA',[SP]],
  ['OM AYURVEDA',[SP]],['MX STORE',[SP]],['IGC',[SP]],['FIT FREAK',[SP]],
  ['X SPEED',[SP]],['KELO INDIA',[SP]],['AJAY TENNIS',[SP]],['FXR',[SP]],
  ['FINCA RESTRO CAFE',[FB]],['KOA CAFE',[FB]],['FORTUNE INN PROMENADE',[FB]],
  ['KATHIYAWADI VILLAGE',[FB]],['FIRANGI BURGERS',[FB]],['ROCKSOUL CAFE',[FB]],
  ['SOUTHAK',[FB]],['TASIR MASALA',[FB]],['THE PIZZA PLANET',[FB]],
  ['ORCHID',[FB]],['FORTUNE VADODARA',[FB]],['MARS',[FB]],
  ['BROOKFIELDZ',[RE]],['LIXUS SPACE LLP',[RE]],['CROSSBOUNDRIES',[RE]],
  ['SUBA ELITE',[RE]],['ARIES GROUPS',[RE]],['YESHA MODI',[RE]],
  ['SHREENATH',[RE]],['REVA CLUBLIFE & REVA LANDMARK',[RE]],['INVENTIA',[RE]],['HUMBLE HOMES',[RE]],
  ['DR. PRIYANKA',[HB]],['EASYDENT CLINIC',[HB]],['THE DENTAL PROJECT',[HB]],
  ['JAWED HABIB',[HB]],['VASU',[HB]],['VIDHISHA',[HB]],['V SALON',[HB]],
  ['FACETYME',[HB]],['NABHISUTRA',[HB]],['KINGEWORLD',[HB]],
  ['REACH HOME SAFE',[HB]],['CHANDAD DENTAL',[HB]],['TRICHUP',[HB]],
  ['SADGURU SCHOOL',[ED]],['SADGURU INSTITUTE',[ED]],['YOU VS YOU',[ED]],
  ['FUTURE LINK',[ED]],['CL LST',[ED]],
  ['OPTIC HOUSE',[LI]],['WHITE LION JEWELS',[LI]],
  ['SHAILY',[CO]],['METSO',[CO]],['CONCENTRIX',[CO]],['PAUSHAK',[CO]],['ART DADA PROP STUDIO',[CO]],
];
const SEED_PROJECTS=RAW.map(([n,c])=>mk(n,c,V[n]||{}));
const cats=[
  {id:U,label:'UGC ADS'},{id:E,label:'ENT & EVENTS'},{id:FA,label:'FASHION'},
  {id:SP,label:'SPORTS'},{id:FB,label:'FOOD & BEV'},{id:RE,label:'REAL ESTATE'},
  {id:HB,label:'HEALTH & BEAUTY'},{id:ED,label:'EDUCATION'},{id:LI,label:'LIFESTYLE'},{id:CO,label:'CORPORATE'},
];
localStorage.setItem('lp_cms_data',JSON.stringify({_version:_V,categories:cats,projects:SEED_PROJECTS}));

}
