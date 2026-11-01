#!/usr/bin/env python3
# SPDX-License-Identifier: 0BSD
"""Run a fixed external test matrix; retain every result, including failures."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import shlex
import subprocess
import time


def main():
    p=argparse.ArgumentParser()
    p.add_argument('engine',type=Path)
    p.add_argument('rng_test',type=Path)
    p.add_argument('results',type=Path)
    followup=p.add_mutually_exclusive_group()
    followup.add_argument('--follow-up-max',action='store_true',help='Extend the maximum-seed warning investigation to 1 GiB')
    followup.add_argument('--follow-up-sparse',action='store_true',help='Extend the high-bit-seed warning investigation to 1 GiB')
    followup.add_argument('--follow-up-both',action='store_true',help='Run both warning investigations sequentially to limit memory')
    args=p.parse_args()
    engine=args.engine.resolve(); tester=args.rng_test.resolve()
    if args.results.exists() and any(args.results.iterdir()):
        raise SystemExit('Results directory is not empty; choose a fresh path to preserve earlier evidence')
    args.results.mkdir(parents=True,exist_ok=True)
    self_test=subprocess.run([str(tester),'--self_test'],capture_output=True,text=True)
    (args.results/'self-test.txt').write_text(self_test.stdout+self_test.stderr)
    if self_test.returncode:
        raise SystemExit('PractRand self-test failed')
    maximum=(1<<64)-1
    cases=[('zero-raw',0,0,'raw',30),('near-raw',1,0,'raw',28),
           ('max-raw',maximum,maximum,'raw',28),('sparse-raw',1<<63,0,'raw',28),
           ('zero-low',0,0,'low',28),('zero-high',0,0,'high',28),
           ('zero-reverse',0,0,'reverse',28),('nearby-seeds',0,0,'nearby',25)]
    if args.follow_up_max:
        cases=[('max-raw-followup',maximum,maximum,'raw',30)]
    if args.follow_up_sparse:
        cases=[('sparse-raw-followup',1<<63,0,'raw',30)]
    if args.follow_up_both:
        cases=[('max-raw-followup',maximum,maximum,'raw',30),('sparse-raw-followup',1<<63,0,'raw',30)]
    is_followup=args.follow_up_max or args.follow_up_sparse or args.follow_up_both

    def run(case):
        name,s0,s1,mode,power=case
        producer_cmd=[str(engine),'stream',str(1<<power),str(s0),str(s1),mode]
        tester_cmd=[str(tester),'stdin32' if mode in ('low','high') else 'stdin64',
                    '-seed','0','-tlmin','28' if is_followup else '20','-tlmax',str(power),'-tf','2','-te','1']
        command=shlex.join(producer_cmd)+' | '+shlex.join(tester_cmd)
        start=time.monotonic()
        with (args.results/f'{name}-producer.txt').open('w') as err:
            producer=subprocess.Popen(producer_cmd,stdout=subprocess.PIPE,stderr=err)
            result=subprocess.run(tester_cmd,stdin=producer.stdout,capture_output=True,text=True)
            producer.stdout.close()
            producer_code=producer.wait()
        log=result.stdout+result.stderr
        (args.results/f'{name}.txt').write_text(log)
        failed='FAIL' in log or 'FATAL' in log or 'error' in log.lower()
        reached=f'2^{power} bytes' in log
        item={'name':name,'seed':[str(s0),str(s1)],'mode':mode,'requested_bytes':1<<power,
              'command':command,'elapsed_seconds':time.monotonic()-start,
              'producer_exit':producer_code,'tester_exit':result.returncode,
              'reached_requested_length':reached,'failure_text_detected':failed,
              'attention_lines':[line for line in log.splitlines()
                                 if any(w in line for w in ('unusual','suspicious','FAIL','VERY'))],
              'log_sha256':hashlib.sha256(log.encode()).hexdigest()}
        print(json.dumps(item),flush=True)
        return item

    with ThreadPoolExecutor(max_workers=1 if is_followup else 2) as pool:
        results=list(pool.map(run,cases))
    (args.results/'summary.json').write_text(json.dumps(results,indent=2)+'\n')
    if any(r['failure_text_detected'] or not r['reached_requested_length']
           or r['tester_exit'] or r['producer_exit'] for r in results):
        raise SystemExit('One or more external runs failed or were incomplete; inspect retained logs')


if __name__=='__main__': main()
