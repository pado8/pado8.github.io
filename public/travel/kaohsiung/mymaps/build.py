# -*- coding: utf-8 -*-
"""index.html 의 DB·PRESET 을 읽어 구글 내 지도용 KML/CSV 를 만든다.

  가오슝-전체.kml   카테고리 6폴더 (후보 전체)
  가오슝-일정.kml   DAY 1~4 폴더 + 순번 + 동선 선
  가오슝-일정.csv   My Maps 가져오기가 더 쉬운 표 형식
"""
import csv, io, json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'index.html')
OUT = os.path.join(ROOT, 'mymaps')

with io.open(SRC, 'r', encoding='utf-8') as f:
    src = f.read()

# ── DB
m = re.search(r'^\s*var DB = (\[.*\]);?\s*$', src, re.M)
db = json.loads(m.group(1))
BYID = {p['id']: p for p in db}

# ── PRESET
pm = re.search(r"var PRESET = \{(.*?)\n  \};", src, re.S)
block = pm.group(1)
preset = {}
for bm in re.finditer(r"'(\d)':\s*\[((?:[^\[\]]|\[[^\]]*\])*)\]", block):
    preset[bm.group(1)] = re.findall(r"\['([^']+)',\s*'([^']+)'\]", bm.group(2))

DAYS = [('1', 'DAY 1', '10/29 목', '#3d5afe'),
        ('2', 'DAY 2', '10/30 금', '#0f9d58'),
        ('3', 'DAY 3', '10/31 토', '#b06000'),
        ('4', 'DAY 4', '11/1 일',  '#d3307f')]

def kmlcolor(hexc):
    """#rrggbb → aabbggrr"""
    h = hexc.lstrip('#')
    return 'ff' + h[4:6] + h[2:4] + h[0:2]

def esc(s):
    return (str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))

CATNAME = {'see': '명소', 'food': '맛집', 'cafe': '카페',
           'shop': '쇼핑', 'stay': '숙소', 'air': '공항·이동'}
ICON = {'see': 'camera', 'food': 'dining', 'cafe': 'coffee',
        'shop': 'shopping', 'stay': 'lodging', 'air': 'airports'}
CATCOLOR = {'see': 'ffE0782E', 'food': 'ff3B37DB', 'cafe': 'ff1F7BC4',
            'shop': 'ffB4479C', 'stay': 'ff43A047', 'air': 'ff707070'}

def gmap(p):
    return 'https://www.google.com/maps/search/?api=1&query=%s,%s' % (p['lat'], p['lng'])

def desc_of(p, head=''):
    bits = []
    if head:
        bits.append(head)
    meta = []
    if p.get('r'):
        meta.append('평점 ' + p['r'])
    if p.get('area'):
        meta.append('지역 ' + p['area'])
    if p.get('dur'):
        meta.append('머무는 시간 약 %.1f시간' % (p['dur'] / 60.0))
    if meta:
        bits.append(' · '.join(meta))
    if p.get('acc'):
        bits.append('가는 법 — ' + p['acc'])
    if p.get('why'):
        bits.append(p['why'])
    bits.append('구글 지도에서 열기: ' + gmap(p))
    return esc('\n'.join(bits))

# ══ 1) 전체 KML ════════════════════════════════════════════════
out = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>',
       '<name>가오슝 3박4일 — 부부 2쌍</name>',
       '<description>aquapado.com/travel/kaohsiung/ 에서 뽑았습니다 (2026-10-04)</description>']
for c, col in CATCOLOR.items():
    out.append('<Style id="s_%s"><IconStyle><color>%s</color><scale>1.1</scale>'
               '<Icon><href>https://maps.google.com/mapfiles/kml/shapes/%s.png</href></Icon></IconStyle>'
               '<LabelStyle><scale>0.9</scale></LabelStyle></Style>' % (c, col, ICON[c]))

for c in ['see', 'food', 'cafe', 'shop', 'stay', 'air']:
    items = [p for p in db if p.get('c') == c and not p.get('nomap') and p.get('lat')]
    if not items:
        continue
    out.append('<Folder><name>%s</name>' % CATNAME[c])
    for p in items:
        out.append('<Placemark><name>%s</name><description>%s</description>'
                   '<styleUrl>#s_%s</styleUrl><Point><coordinates>%s,%s,0</coordinates></Point></Placemark>'
                   % (esc(p['n']), desc_of(p), c, p['lng'], p['lat']))
    out.append('</Folder>')
out.append('</Document></kml>')

p_all = os.path.join(OUT, '가오슝-전체.kml')
with io.open(p_all, 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(out))
n_all = sum(1 for p in db if not p.get('nomap') and p.get('lat'))
print('가오슝-전체.kml  %d곳' % n_all)

# ══ 2) 일정 KML ════════════════════════════════════════════════
out = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>',
       '<name>가오슝 일정 (10/29–11/1)</name>',
       '<description>트리플 초안 기준 · aquapado.com/travel/kaohsiung/ 일정 탭과 같은 내용입니다 (2026-10-04)</description>']
for k, t, d, col in DAYS:
    kc = kmlcolor(col)
    out.append('<Style id="d%s"><IconStyle><color>%s</color><scale>1.15</scale>'
               '<Icon><href>https://maps.google.com/mapfiles/kml/paddle/%s-circle.png</href></Icon></IconStyle>'
               '<LabelStyle><scale>0.95</scale></LabelStyle>'
               '<LineStyle><color>%s</color><width>4</width></LineStyle></Style>'
               % (k, kc, 'blu' if k == '1' else 'grn' if k == '2' else 'orange' if k == '3' else 'pink', kc))

rows = []
for k, t, d, col in DAYS:
    pairs = preset.get(k, [])
    stops = [(BYID[i], tm) for i, tm in pairs if i in BYID and BYID[i].get('lat') and not BYID[i].get('nomap')]
    if not stops:
        continue
    out.append('<Folder><name>%s · %s</name>' % (t, d))
    for n, (p, tm) in enumerate(stops, 1):
        head = '%s %s · %d번째' % (t, tm, n)
        out.append('<Placemark><name>%d. %s</name><description>%s</description>'
                   '<styleUrl>#d%s</styleUrl><Point><coordinates>%s,%s,0</coordinates></Point></Placemark>'
                   % (n, esc(p['n']), desc_of(p, head), k, p['lng'], p['lat']))
        rows.append([p['n'], str(p['lat']), str(p['lng']),
                     '%s,%s' % (p['lat'], p['lng']),
                     t, d, str(n), tm, p.get('area', ''),
                     (p.get('why', '') or '').replace('\n', ' ')])
    if len(stops) > 1:
        coords = ' '.join('%s,%s,0' % (p['lng'], p['lat']) for p, _ in stops)
        out.append('<Placemark><name>%s 동선</name><styleUrl>#d%s</styleUrl>'
                   '<LineString><tessellate>1</tessellate><coordinates>%s</coordinates></LineString></Placemark>'
                   % (t, k, coords))
    out.append('</Folder>')
out.append('</Document></kml>')

p_plan = os.path.join(OUT, '가오슝-일정.kml')
with io.open(p_plan, 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(out))
print('가오슝-일정.kml  %d곳' % len(rows))

# ══ 3) 일정 CSV ════════════════════════════════════════════════
import csv
p_csv = os.path.join(OUT, '가오슝-일정.csv')
with io.open(p_csv, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    # ⚠ 구글 내 지도는 한국어 '위도/경도' 열 이름을 못 읽고 역할을 거꾸로 배정한 적이 있다
    # ("위도 (경도)" 처럼 괄호로 제 배정을 보여주는데 그게 뒤바뀐다).
    # 영문 표준 이름을 앞에 두고, 한 열에 합친 Coordinates 도 같이 넣는다 —
    # 그 한 열만 고르면 뒤바뀔 여지가 없다.
    w.writerow(['Name', 'Latitude', 'Longitude', 'Coordinates',
                '날짜', '요일', '순번', '시각', '지역', '메모'])
    w.writerows(rows)
print('가오슝-일정.csv  %d행' % len(rows))

for k, t, d, col in DAYS:
    print('  %s %s : %d곳' % (t, d, len([r for r in rows if r[4] == t])))

# ══ 4) 종류별 CSV (기존 형식 유지) ══════════════════════════════
FN = {'see': '명소', 'food': '맛집', 'cafe': '카페',
      'shop': '쇼핑', 'stay': '숙소', 'air': '공항-이동'}
counts = {}
for c in ['see', 'food', 'cafe', 'shop', 'stay', 'air']:
    items = [p for p in db if p.get('c') == c and not p.get('nomap') and p.get('lat')]
    counts[c] = len(items)
    path = os.path.join(OUT, '가오슝-%s.csv' % FN[c])
    with io.open(path, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(['Name', 'Latitude', 'Longitude', 'Coordinates',
                    '분류', '평점', '지역', '가는 법', '설명', '구글지도'])
        for p in items:
            w.writerow([p['n'], p['lat'], p['lng'], '%s,%s' % (p['lat'], p['lng']),
                        CATNAME[c], p.get('r', ''),
                        p.get('area', ''), p.get('acc', ''),
                        (p.get('why', '') or '').replace('\n', ' '), gmap(p)])
print('\n종류별 CSV:', {CATNAME[c]: n for c, n in counts.items()})
print('합계 %d곳' % sum(counts.values()))
