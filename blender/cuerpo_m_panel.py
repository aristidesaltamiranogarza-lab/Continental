# Panel "Mujer" en la barra lateral (N) del visor 3D: deslizadores que rearman el cuerpo de mujer en vivo
# (corren cuerpo_m.py con PRM). Los valores quedan en la escena (scene.cm_*); despues se pasan a K de cuerpo_m.py.
# Uso: exec(open(r'C:/Users/aris1/code/Continental/blender/cuerpo_m_panel.py').read(), {})
import bpy

RUTA = r'C:/Users/aris1/code/Continental/blender/cuerpo_m.py'
P = [   # (propiedad, etiqueta, defecto, min, max)
    ('busto', 'Busto: tamano', 0.06, 0.0, 0.16),
    ('busto_z', 'Busto: altura', 1.415, 1.22, 1.45),
    ('busto_sep', 'Busto: separacion', 0.13, 0.05, 0.16),
    ('busto_ancho', 'Busto: ancho', 0.055, 0.03, 0.10),
    ('busto_arriba', 'Busto: curva arriba', 0.12, 0.05, 0.16),
    ('busto_abajo', 'Busto: curva abajo', 0.075, 0.05, 0.16),
    ('puente', 'Busto: centro', 0.72, 0.4, 1.0),
    ('hombros', 'Hombros', 0.863, 0.7, 1.0),
    ('pecho', 'Pecho', 0.79, 0.7, 1.0),
    ('cintura', 'Cintura', 0.66, 0.55, 0.95),
    ('cadera', 'Cadera (playera)', 0.92, 0.8, 1.1),
    ('brazo', 'Grosor de brazos', 0.805, 0.7, 1.0),
    ('cadera_p', 'Piernas: cadera', 1.18, 1.0, 1.35),
    ('muslo', 'Piernas: muslo', 1.22, 0.75, 1.3),
    ('rodilla', 'Piernas: rodilla', 0.78, 0.55, 0.95),
    ('pantorrilla', 'Piernas: pantorrilla', 0.71, 0.6, 1.0),
    ('tobillo', 'Piernas: tobillo', 0.62, 0.45, 0.85),
    ('abre', 'Piernas: espacio entre ellas', 0.10, 0.0, 0.6),
    ('gluteo', 'Piernas: gluteo', 0.12, 0.0, 0.3),
    ('pant_atras', 'Piernas: pantorrilla atras', 0.16, 0.0, 0.25),
    ('pie', 'Zapatos', 0.8, 0.6, 1.0),
    ('mano', 'Manos', 0.9, 0.7, 1.0),
]

def prm(s):
    g = lambda k: getattr(s, 'cm_' + k)
    h, pe, ci, ca = g('hombros'), g('pecho'), g('cintura'), g('cadera')
    return dict(A=g('busto'), BZ=g('busto_z'), BX=g('busto_sep'), BW=g('busto_ancho'), SZ_A=g('busto_arriba'),
                SZ_B=g('busto_abajo'), PUENTE=g('puente'), CADERA=g('cadera_p'), BRAZO=g('brazo'),
                MUSLO=g('muslo'), RODILLA=g('rodilla'), PANTORRILLA=g('pantorrilla'), TOBILLO=g('tobillo'),
                ABRE=g('abre'), GLUTEO=g('gluteo'), PANT_ATRAS=g('pant_atras'), PIE=g('pie'), MANO=g('mano'),
                PERFIL=[(1.66, h, 0.92), (1.50, h, 0.90), (1.36, pe, 0.88), (1.24, (pe + ci) / 2 + 0.01, 0.84),
                        (1.12, ci, 0.82), (1.02, (ci + ca) / 2 + 0.01, 0.86), (0.92, ca, 0.90)])

def rearma(self, ctx):
    exec(open(RUTA).read(), {'PRM': prm(ctx.scene)})

for k, t, d, a, b in P:
    setattr(bpy.types.Scene, 'cm_' + k, bpy.props.FloatProperty(name=t, default=d, min=a, max=b, step=0.1,
                                                                   precision=3, update=rearma))

class CM_PT_mujer(bpy.types.Panel):
    bl_label = 'Cuerpo de mujer'; bl_space_type = 'VIEW_3D'; bl_region_type = 'UI'; bl_category = 'Mujer'
    def draw(self, ctx):
        for k, *_ in P: self.layout.prop(ctx.scene, 'cm_' + k)

if hasattr(bpy.types, 'CM_PT_mujer'): bpy.utils.unregister_class(bpy.types.CM_PT_mujer)
bpy.utils.register_class(CM_PT_mujer)
print('panel Mujer listo')
