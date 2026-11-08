export class Sound {
  enabled=true; private ctx:AudioContext|null=null;
  unlock(){try{this.ctx??=new AudioContext();if(this.ctx.state==='suspended')void this.ctx.resume();}catch{/* Sound is optional. */}}
  play(type:string){
    if(!this.enabled||!this.ctx)return;
    const ctx=this.ctx,osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);
    const now=ctx.currentTime;
    const [start,end,duration,volume]=type==='deploy'?[280,95,.18,.12]:type==='skill'?[180,820,.35,.10]:type==='leak'||type==='down'?[170,60,.4,.13]:type==='heal'?[600,900,.12,.035]:type==='attack'?[190,70,.05,.025]:[430,620,.07,.045];
    osc.type=type==='attack'?'triangle':'sine';osc.frequency.setValueAtTime(start,now);osc.frequency.exponentialRampToValueAtTime(end,now+duration);gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.start(now);osc.stop(now+duration);
  }
}
