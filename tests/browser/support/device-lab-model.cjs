"use strict";
// Layer 3 of the device lab: a GPU budget MODEL, not a measurement. It turns the counters the cpu mode records (draw calls, triangles,
// render passes and pixels per pass, GPU memory allocations) into "how much of a 60 fps frame would this ask of each GPU", using
// published or derived throughput. Every constant below is an assumption stated in the open; change one and the verdicts move.
//   demand   = pixels shaded per frame (sum over passes of the viewport area, times an overdraw factor) x per-pixel cost x 60
//   capacity = published peak x a sustainable fraction (real games never reach peak: overdraw, blending, shader stalls, a shared bus)
//   ratio    = demand / capacity for fill, ALU and memory bandwidth; the largest one decides the verdict.
const SPECS = {
    iphone17: {
        gpu: "Apple A19 (5-core GPU, 8 GB shared LPDDR5X)",
        flops: 1.8e12, flopsNote: "estimate: 640 ALUs x 2 FLOP x ~1.4 GHz (ALU count published, clock not)",
        bandwidth: 68.26e9, bandwidthNote: "published 68.26 GB/s (8,533 MT/s)",
        fill: 25e9, fillNote: "estimate (not published)",
        sustainFill: .3, sustainFlops: .3, sustainBw: .4, memBudgetMB: 1000, memNote: "soft budget for one Safari tab before it is reloaded (estimate)"
    },
    chromebook: {
        gpu: "Intel UHD Graphics, Jasper Lake 24 EU (shared LPDDR4x, 4 GB)",
        flops: 307e9, flopsNote: "derived: 24 EU x 8 FP32 lanes x 2 FLOP x 0.8 GHz (EU count and 800 MHz boost published)",
        bandwidth: 25.6e9, bandwidthNote: "typical single-channel LPDDR4x-3200 (51 GB/s if dual-channel); shared with the CPU",
        fill: 5e9, fillNote: "estimate (not published)",
        sustainFill: .3, sustainFlops: .3, sustainBw: .35, memBudgetMB: 512, memNote: "soft GPU-memory budget on a 4 GB machine (estimate)"
    },
    pc: {
        gpu: "NVIDIA GeForce RTX 4090 (24 GB GDDR6X)",
        flops: 82.58e12, flopsNote: "published 82.58 TFLOPS FP32",
        bandwidth: 1008e9, bandwidthNote: "published 1008 GB/s",
        fill: 443.5e9, fillNote: "176 ROPs x 2.52 GHz",
        sustainFill: .3, sustainFlops: .3, sustainBw: .5, memBudgetMB: 8000, memNote: "much less than the 24 GB on the card"
    }
};
const ASSUME = {
    overdraw: 2,        // each pixel of a pass is shaded about twice (crowd, glass, particles, transparent layers)
    flopsPerPixel: 150, // PBR lighting, shadow lookups, IBL and tone mapping per shaded pixel and pass
    bytesPerPixel: 24,  // colour write 8 (HDR) + depth 4 + the next pass reads it back 8 + shadow/other reads 4
    fps: 60
};
const specKey = profile => profile === "iphone17" ? "iphone17" : /^chromebook/.test(profile) ? "chromebook" : "pc";

// r: one result of the cpu mode. Returns the per-resource ratios and a verdict.
function model(r){
    const s = SPECS[specKey(r.profile)];
    if(!r || r.error || !r.passPxMedian) return null;
    const px = r.passPxMedian * ASSUME.overdraw;
    const fill = px * ASSUME.fps / (s.fill * s.sustainFill);
    const alu = px * ASSUME.flopsPerPixel * ASSUME.fps / (s.flops * s.sustainFlops);
    const bw = px * ASSUME.bytesPerPixel * ASSUME.fps / (s.bandwidth * s.sustainBw);
    // Memory: this is CUMULATIVE (every texture and render target the page asked for, resizes included), so it is an upper bound on what is live at once. Textures + render-target renderbuffers allocated while the scene ran, plus the page's own drawing buffer.
    const c = r.canvas || { w: 0, h: 0 };
    const buffer = c.w * c.h * (4 + 4 + (r.msaa ? 4 * 4 : 0)) / 1048576; // colour + depth (+ 4x MSAA colour) of the default framebuffer
    const memMB = (r.allocTexMB || 0) + (r.allocRbMB || 0) + buffer;
    const mem = memMB / s.memBudgetMB;
    const worst = Math.max(fill, alu, bw, mem);
    const limit = worst === bw ? "memory bandwidth" : worst === alu ? "shader ALU" : worst === fill ? "pixel fill" : "GPU memory";
    return { pixelsPerFrame: px, fill, alu, bw, memMB, mem, worst, limit, verdict: worst >= 1 ? "likely over budget" : worst >= .6 ? "tight" : "ok" };
}
module.exports = { SPECS, ASSUME, model, specKey };
