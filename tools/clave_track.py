import numpy as np, wave, sys, os
SR=24000; BPM=90; Q=60/BPM; E=Q/2; BARS=4; N=int(round(BARS*4*Q*SR))
rng=np.random.default_rng(7)
out=np.zeros(N+SR)  # coda per code che sforano, poi riavvolte (loop senza buchi)
def t(n): return np.arange(n)/SR
def add(sig,at,g=1.0):
    i=int(round(at*SR)); out[i:i+len(sig)]+=sig*g
def env(n,dec): return np.exp(-t(n)/dec)
def lp(x,a):  # filtro passa-basso 1 polo
    y=np.zeros_like(x); s=0.0
    for i,v in enumerate(x): s+=a*(v-s); y[i]=s
    return y
# --- strumenti
def clave():
    n=int(.09*SR); tt=t(n); return (np.sin(2*np.pi*2450*tt)+.4*np.sin(2*np.pi*3900*tt))*env(n,.018)
def campana(hi):
    n=int(.35*SR); tt=t(n); f=(820 if hi else 560)
    s=np.sign(np.sin(2*np.pi*f*tt))+np.sign(np.sin(2*np.pi*f*1.48*tt))
    return lp(s,.35)*env(n,.07)*.5
def conga(kind):
    n=int(.4*SR); tt=t(n)
    if kind=='open':
        f=230*np.exp(-tt*3)+190; ph=2*np.pi*np.cumsum(f)/SR; return np.sin(ph)*env(n,.16)
    if kind=='slap':
        nz=rng.standard_normal(n)*env(n,.025); return (np.sin(2*np.pi*420*tt)*env(n,.05)+.8*nz)*.8
    # heel/toe morbidi
    return np.sin(2*np.pi*150*tt)*env(n,.04)*.45
def bass(f):
    n=int(.6*SR); tt=t(n)
    s=np.sin(2*np.pi*f*tt)+.35*np.sin(4*np.pi*f*tt)+.15*np.sin(6*np.pi*f*tt)
    a=np.minimum(1,tt/.008); return s*a*env(n,.35)
def piano(freqs,dur=.32):
    n=int(dur*SR); tt=t(n); s=np.zeros(n)
    for f in freqs:
        for h,g in ((1,1),(2,.5),(3,.25),(4,.12)): s+=g*np.sin(2*np.pi*f*h*tt)*env(n,.5/h)
    a=np.minimum(1,tt/.004); r=np.minimum(1,(dur-tt)/.03)
    return s*a*r/len(freqs)
def voice(name):
    w=wave.open(name); sr=w.getframerate(); x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16)/32768
    x=np.interp(np.arange(0,len(x),sr/SR),np.arange(len(x)),x)
    k=np.argmax(np.abs(x)>.04); x=x[max(0,k-int(.01*SR)):]  # attacco sul battito
    return x/np.max(np.abs(x))
note=lambda m:440*2**((m-69)/12)
# accordi per battuta: C F G F (montuno), basso anticipa la battuta seguente
CH=[[60,64,67],[65,69,72],[67,71,74],[65,69,72]]; ROOT=[36,41,43,41]
FIFTH=[43,48,50,48]
VO={n:voice(f'v_{n}.wav') for n in ['uno','dos','tres','cinco','seis','siete']}
for b in range(BARS):
    t0=b*4*Q
    # clave 3-2 (2 battute, in crome): 0,3,6 | 10,12
    for k in ([0,3,6] if b%2==0 else [2,4]): add(clave(),t0+k*E,.55)
    for q in range(4): add(campana(q%2==1),t0+q*Q,.22 if q else .3)
    pat=['heel','toe','slap','toe','heel','toe','open','open']
    for k,kind in enumerate(pat): add(conga(kind),t0+k*E,.5 if kind=='open' else .4)
    nb=(b+1)%BARS
    add(bass(note(FIFTH[nb])),t0+3*E,.55); add(bass(note(ROOT[nb])),t0+6*E,.6)
    # montuno: arpeggio in crome a ottave, anticipo dell'accordo sull'ultima croma
    for k in range(8):
        ch=CH[nb] if k==7 else CH[b]; seq=[ch[2],ch[0]+12,ch[1]+12,ch[2]]
        m=seq[k%4]; add(piano([note(m),note(m+12)]),t0+k*E,.2)
    # voce: 1 2 3 (pausa) 5 6 7 (pausa) su ogni battuta
    words=['uno','dos','tres'] if b%2==0 else ['cinco','seis','siete']
    for q,wd in enumerate(words): add(VO[wd],t0+q*Q,.9)
# riavvolge la coda all'inizio: loop continuo
tail=out[N:]; out[:len(tail)]+=tail; out=out[:N]
out=out/np.max(np.abs(out))*.89
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype(np.int16).tobytes())
print('ok',N/SR,'s')
