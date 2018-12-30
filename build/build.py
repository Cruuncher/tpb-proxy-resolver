import click
import configparser
import os
from shutil import copyfile
from shutil import make_archive
from distutils.dir_util import copy_tree
import glob
import pathlib

def parse_config(config_path):
    config = configparser.ConfigParser() 
    config.read(config_path)
    return dict(config['DEFAULT'])

def build_dst_directory(dst):
    if not os.path.exists(dst):
        os.makedirs(dst)
    if not os.path.isdir(dst):
        print("Destination is not a directory")
        return False 
    if len(os.listdir(dst)) > 0:
        print("Destination directory is not empty")
        return False 

    return True

def copy_manifest(src, dst, manifest):
    manifest_src_path = os.path.join(src, manifest)
    manifest_dst_path = os.path.join(dst, "manifest.json")
    if not os.path.exists(manifest_src_path):
        print("Could not find manifest file")
        return False 

    copyfile(manifest_src_path, manifest_dst_path)
    return True

def copy_dir(src, dst, dir):
    src_path = os.path.join(src, dir)
    dst_path = os.path.join(dst, dir)
    if not os.path.exists(src_path):
        print("No {} directory".format(dir))
        return False

    copy_tree(src_path, dst_path)
    return True

def copy_dirs(src, dst, dirs):
    for dir in dirs:
        if not copy_dir(src, dst, dir):
            return False 
    return True

def copy_background_js(src, dst):
    bg_src_path = os.path.join(src, "background.js")
    bg_dst_path = os.path.join(dst, "background.js")
    if not os.path.exists(bg_src_path):
        print("No background.js file")
        return False 

    copyfile(bg_src_path, bg_dst_path)
    return True

def copy_files(src, dst, build_config):
    if not copy_manifest(src, dst, build_config['manifest']):
        return False

    if not copy_dirs(src, dst, ("images", "options")):
        return False

    if not copy_background_js(src, dst):
        return False

    return True

def resolve_js_file(jsfile, dst, build_config):
    toplevel = build_config['toplevel']
    runtime_namespace = build_config['runtime_namespace']

    filepath = os.path.join(dst, jsfile)
    if not os.path.exists(filepath):
        print("jsfile {} not found in destination".format(jsfile))
        return False 

    with open(filepath, 'r') as file:
        filedata = file.read()

    filedata = filedata.replace('{{$TOPLEVEL}}', toplevel)
    filedata = filedata.replace('{{$RUNTIME_NAMESPACE}}', runtime_namespace)

    with open(filepath, 'w') as file:
        file.write(filedata)

    return True
    

def resolve_js_files(src, dst, build_config):
    src_glob = os.path.join(src, "**", "*.js")
    for filename in glob.iglob(src_glob, recursive=True):
        filepath = pathlib.Path(filename)
        relative_filepath = filepath.relative_to(src)
        if not resolve_js_file(relative_filepath, dst, build_config):
            return False
    return True

def zip_it(dst):
    dirname = os.path.basename(dst)
    filename = os.path.join(dst, "..", dirname)
    make_archive(filename, 'zip', dst)

@click.command()
@click.argument("config_file")
@click.argument("version")
@click.option("--src", default="../src", help="Source Directory")
@click.option("--dst", help="Build Destination")
def build(config_file, version, src, dst):
    if not os.path.isdir(src):
        print("Not a real source dir")
        return 

    build_config = parse_config(config_file)
    if not dst:
        dst = "builds/tpb-proxy-resolver-{}-{}".format(build_config['browser'], version)

    if not build_dst_directory(dst):
        return

    if not copy_files(src, dst, build_config):
        return 

    if not resolve_js_files(src, dst, build_config):
        return

    if not zip_it(dst):
        return

if __name__ == '__main__':
    build()