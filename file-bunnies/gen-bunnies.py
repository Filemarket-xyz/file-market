import os
import argparse
from concurrent.futures import ThreadPoolExecutor
import logging
from itertools import product
from PIL import Image

WIDTH = 2048
HEIGHT = 2048

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

parser = argparse.ArgumentParser(description="A script to generate File-Bunnies NFTs. Script assumes that all parts is equal sized.")
parser.add_argument('--src', type=str, required=True, help='Path to the directory with NFT parts.')
parser.add_argument('--dst', type=str, required=True, help='Path to the destination directory.')
args = parser.parse_args()


def process_image(parts, count, dstpath):
    bg, boots, bunnie, fc, glasses, pet = parts

    new_image = Image.new('RGBA', (WIDTH, HEIGHT))

    bg_img      = Image.open(bg).convert("RGBA")
    bunnie_img  = Image.open(bunnie).convert("RGBA")
    boots_img   = Image.open(boots).convert("RGBA")
    glasses_img = Image.open(glasses).convert("RGBA")
    fc_img      = Image.open(fc).convert("RGBA")
    pet_img     = Image.open(pet).convert("RGBA")

    new_image = Image.alpha_composite(new_image, bg_img)
    new_image = Image.alpha_composite(new_image, bunnie_img)
    new_image = Image.alpha_composite(new_image, boots_img)
    new_image = Image.alpha_composite(new_image, glasses_img)
    new_image = Image.alpha_composite(new_image, fc_img)
    new_image = Image.alpha_composite(new_image, pet_img)

    # TODO: Save to separate dir, gen metadata, gen aes key etc.
    new_image.save(f"{dstpath}{count}.png")
    logging.info(f"Processed combination #{count}.")


def main():
    parts_path = os.path.abspath(os.path.normpath(args.src)) + os.path.sep
    dst_path   = os.path.abspath(os.path.normpath(args.dst)) + os.path.sep

    os.chdir(parts_path)

    background_files = [parts_path + 'background/' + f for f in os.listdir('background/') if f.endswith(".png")]
    boots_files      = [parts_path + 'boots/' + f for f in os.listdir('boots/') if f.endswith(".png")]
    bunnies_files    = [parts_path + 'bunnies/' + f for f in os.listdir('bunnies/') if f.endswith(".png")]
    filecoin_files   = [parts_path + 'filecoin for the body/' + f for f in os.listdir('filecoin for the body/') if f.endswith(".png")]
    glasses_files    = [parts_path + 'glasses/' + f for f in os.listdir('glasses/') if f.endswith(".png")]
    pets_files       = [parts_path + 'pets/' + f for f in os.listdir('pets/') if f.endswith(".png")]

    try:
        os.mkdir(dst_path)
    except OSError as error:
        pass

    os.chdir(dst_path)

    num_combos = len(background_files) * len(boots_files) * len(bunnies_files) * len(filecoin_files) * len(glasses_files) * len(pets_files)
    logging.info(f"Started processing {num_combos} NFTs...")

    count = 0
    with ThreadPoolExecutor() as executor:
        for parts in product(background_files, boots_files, bunnies_files, filecoin_files, glasses_files, pets_files):
            executor.submit(process_image, parts, count, dst_path)
            count += 1

    logging.info(f"Finished processing {count} images in {num_combos} combinations.")


if __name__ == "__main__":
    main()
