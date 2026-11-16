# Quality gate: p7_stopout vs Reference (512², code cc419b58bb44)

P7: Normal, outgoing rays stopped beyond 60 M (emission views without a sky only; the sky measure does not apply).

| scene | chaos | class agr. | sky px med / p99 | emission L1 (avg / t₀ / t₁ / t₂) | p99 rel (worst) | flux (worst) | dt p99 (M) | LC corr | chaotic flux | class-frac Δ | speed-up |
|---|---|---|---|---|---|---|---|---|---|---|---|
| kerr_a0_inc17 | 0.00% | 99.998% | 1.1e+1 / 6.3e+1 | 1.7e-4 / 1.5e-3 / 1.4e-3 / 1.3e-3 | 5.7e-3 | 1.8e-4 | 3.2e-2 | 1.000000 | 8.3e-5 | 0.0e+0 | 1.62× |
| kerr_a0_inc80 | 0.00% | 100.000% | 1.0e+1 / 5.7e+1 | 3.5e-4 / 1.4e-3 / 1.6e-3 / 1.5e-3 | 5.2e-3 | 5.9e-4 | 1.9e-2 | 0.999998 | -1.2e-4 | 0.0e+0 | 1.43× |
| kerr_a0.94_inc17 | 0.00% | 99.998% | 1.3e+1 / 6.6e+1 | 1.7e-4 / 1.5e-3 / 1.7e-3 / 1.3e-3 | 6.5e-3 | 1.7e-4 | 3.1e-2 | 1.000000 | 2.7e-4 | 8.3e-2 | 1.77× |
| kerr_a0.94_inc80 | 0.01% | 99.999% | 1.2e+1 / 7.4e+1 | 2.8e-4 / 1.4e-3 / 1.6e-3 / 1.6e-3 | 5.2e-3 | 2.5e-4 | 2.1e-2 | 0.999999 | -1.3e-4 | 0.0e+0 | 1.52× |
| kerr_a0.998_inc80 | 0.02% | 99.999% | 1.2e+1 / 7.6e+1 | 2.9e-4 / 1.5e-3 / 1.7e-3 / 1.7e-3 | 5.3e-3 | 2.4e-4 | 2.3e-2 | 0.999999 | 6.7e-5 | 0.0e+0 | 2.27× |
| johannsen_a0.94_a13_5.5 | 0.00% | 99.999% | 9.9e+0 / 5.6e+1 | 2.0e-4 / 1.6e-3 / 1.7e-3 / 1.5e-3 | 6.0e-3 | 2.2e-4 | 4.6e-2 | 1.000000 | 4.5e-4 | 0.0e+0 | 2.06× |
| mankoNovikov_a0.94_a3_2 | 0.01% | 99.998% | 1.3e+1 / 6.7e+1 | 1.9e-4 / 1.4e-3 / 1.8e-3 / 1.4e-3 | 6.3e-3 | 2.2e-4 | 2.7e-2 | 0.999999 | 4.1e-3 | 0.0e+0 | 2.95× |
| rn_Q0.8_inc60 | 0.01% | 100.000% | 1.3e+1 / 6.5e+1 | 4.2e-4 / 1.4e-3 / 1.7e-3 / 1.4e-3 | 5.8e-3 | 4.0e-4 | 2.3e-2 | 0.999999 | 8.6e-4 | 0.0e+0 | 1.45× |
| st3cr_l0.05 | 2.09% | 99.986% | 0.0e+0 / 0.0e+0 | 0.0e+0 / 0.0e+0 / 0.0e+0 / 0.0e+0 | 0.0e+0 | 0.0e+0 | 0.0e+0 | 1.000000 | 0.0e+0 | 2.9e-2 | 1.46× |
| st3cr_l5e-3 | 3.30% | 98.689% | 0.0e+0 / 0.0e+0 | 0.0e+0 / 0.0e+0 / 0.0e+0 / 0.0e+0 | 0.0e+0 | 0.0e+0 | 0.0e+0 | 1.000000 | 0.0e+0 | 4.6e-1 | 1.68× |
| st3cr_l1e-3 | 2.47% | 97.583% | 0.0e+0 / 0.0e+0 | 0.0e+0 / 0.0e+0 / 0.0e+0 / 0.0e+0 | 0.0e+0 | 0.0e+0 | 0.0e+0 | 1.000000 | 0.0e+0 | 4.3e-1 | 2.63× |
| st3cr_l1e-4 | 3.04% | 97.517% | 0.0e+0 / 0.0e+0 | 0.0e+0 / 0.0e+0 / 0.0e+0 / 0.0e+0 | 0.0e+0 | 0.0e+0 | 0.0e+0 | 1.000000 | 0.0e+0 | 4.1e-1 | 1.62× |
| st3cr_l0 | 0.07% | 100.000% | 0.0e+0 / 0.0e+0 | 0.0e+0 / 0.0e+0 / 0.0e+0 / 0.0e+0 | 0.0e+0 | 0.0e+0 | 0.0e+0 | 1.000000 | 0.0e+0 | 0.0e+0 | 0.89× |

Normal budgets passed per scene: kerr_a0_inc17: all; kerr_a0_inc80: all; kerr_a0.94_inc17: all; kerr_a0.94_inc80: all; kerr_a0.998_inc80: all; johannsen_a0.94_a13_5.5: all; mankoNovikov_a0.94_a3_2: all; rn_Q0.8_inc60: all; st3cr_l0.05: chaoticFractions; st3cr_l5e-3: classAgreement, chaoticFractions; st3cr_l1e-3: classAgreement, chaoticFractions; st3cr_l1e-4: classAgreement, chaoticFractions; st3cr_l0: all
