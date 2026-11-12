"""Refresh factual catalogue membership. Python standard library only; no account/key."""
import argparse, datetime, json, pathlib, urllib.parse, urllib.request
QUERY = 'SELECT DISTINCT ?brand ?item ?itemLabel ?english ?date ?douban ?imdb ?movie ?tv ?root WHERE {\n VALUES (?brand ?company) { ("netflix" wd:Q907311) ("netflix" wd:Q116452644) ("hbo" wd:Q23633) ("apple" wd:Q62446736) ("bbc" wd:Q9531) ("bbc" wd:Q191472) ("a24" wd:Q16248298) ("ghibli" wd:Q182950) ("pixar" wd:Q127552) ("marvel" wd:Q367466) }\n { ?item wdt:P272 ?company } UNION { VALUES ?brand { "a24" "ghibli" "pixar" "marvel" } ?item wdt:P750 ?company } UNION { ?item wdt:P449 ?company }\n FILTER NOT EXISTS { ?item wdt:P31/wdt:P279* wd:Q21191270 } FILTER NOT EXISTS { ?item wdt:P31/wdt:P279* wd:Q3464665 } VALUES ?root {wd:Q11424 wd:Q5398426 wd:Q1259759 wd:Q15416 wd:Q24862 wd:Q93204} ?item wdt:P31/wdt:P279* ?root. FILTER NOT EXISTS { VALUES ?excluded {wd:Q27889498 wd:Q1358344 wd:Q24634210 wd:Q2635894} ?item wdt:P31/wdt:P279* ?excluded } OPTIONAL {?item wdt:P577 ?date} OPTIONAL {?item wdt:P4529 ?douban} OPTIONAL {?item wdt:P345 ?imdb} OPTIONAL {?item wdt:P4947 ?movie} OPTIONAL {?item wdt:P4983 ?tv} OPTIONAL {?item rdfs:label ?english FILTER(LANG(?english)="en")}\n FILTER(BOUND(?douban) || BOUND(?imdb) || BOUND(?movie) || BOUND(?tv))\n SERVICE wikibase:label {bd:serviceParam wikibase:language "zh-cn,zh-hans,zh,en".}\n}'

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--input',type=pathlib.Path);parser.add_argument('--write',action='store_true');args=parser.parse_args()
 root=pathlib.Path(__file__).resolve().parents[1];path=root/'src/lib/catalog/directory.json'
 old=json.loads(path.read_text(encoding='utf-8'));known={x['id']:x for items in old['brands'].values() for x in items}
 if args.input:raw=json.loads(args.input.read_text(encoding='utf-8'))
 else:
  url='https://query.wikidata.org/sparql?'+urllib.parse.urlencode({'query':QUERY,'format':'json'})
  req=urllib.request.Request(url,headers={'User-Agent':'haruTV-catalog-maintainer/0.4 (+https://github.com/scj040921/haruTV)','Accept':'application/sparql-results+json'})
  with urllib.request.urlopen(req,timeout=60) as response:raw=json.load(response)
 groups={}
 for row in raw['results']['bindings']:
  brand=row['brand']['value'];qid=row['item']['value'].split('/')[-1]
  value=groups.setdefault(brand,{}).setdefault(qid,{'rows':[],'roots':set()});value['rows'].append(row);value['roots'].add(row['root']['value'].split('/')[-1])
 result={}
 for brand,records in groups.items():
  items=[]
  for qid,record in records.items():
   if not (record['roots']-{'Q15416'}):continue
   rows=record['rows']
   def field(name):return next((r[name]['value'] for r in rows if name in r),'')
   title=field('itemLabel')
   if not title or title==qid:continue
   dates=sorted({r['date']['value'][:10] for r in rows if 'date' in r})
   year=dates[0][:4] if dates else ''
   item={'id':qid,'title':title,'originalTitle':field('english'),'year':year,'cover':'','rating':None,'kind':'tv' if record['roots']&{'Q5398426','Q1259759'} else 'movie','genres':[],'countries':[],'subtitle':year,'sourceUrl':'https://www.wikidata.org/wiki/'+qid,'doubanId':field('douban'),'imdbId':field('imdb')}
   previous=known.get(qid)
   if previous:
    for key in ['title','cover','rating','genres','countries','subtitle']:item[key]=previous.get(key,item[key])
   items.append(item)
  items.sort(key=lambda x:(bool(x['cover']),x['rating'] or 0,x['year']),reverse=True);result[brand]=items
 counts={b:len(items) for b,items in result.items()};print(json.dumps(counts,ensure_ascii=False,indent=2))
 if set(result)!=set(old['brands']) or sum(counts.values())<1000:raise RuntimeError('Incomplete refresh; current snapshot was not replaced')
 if args.write:
  updated=datetime.date.today().isoformat();data={'updatedAt':updated,'source':old['source'],'brands':result}
  temp=path.with_suffix('.tmp');temp.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8');temp.replace(path)
  (root/'src/lib/catalog/directory-summary.json').write_text(json.dumps({'updatedAt':updated,'counts':counts},ensure_ascii=False,indent=2),encoding='utf-8')
if __name__=='__main__':main()
