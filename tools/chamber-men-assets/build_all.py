"""Rebuild the Chamber Men stadium-kit textures made from code (the ball and the grass come from CC0 downloads: gen_ball_v3.py, gen_grass.py) into visual-assets/v10_1/chamber-men/assets/.

    cd tools/chamber-men-assets && python3 build_all.py

Needs only numpy and Pillow (with WebP). Deterministic: the same code gives the same pictures.
"""
import gen_stadium

if __name__ == '__main__':
    sizes = {}
    sizes.update(gen_stadium.main())
    for k in sorted(sizes):
        print(f'{k:28s} {sizes[k] / 1024:7.0f} KB')
    print(f'{"total":28s} {sum(sizes.values()) / 1024:7.0f} KB')
