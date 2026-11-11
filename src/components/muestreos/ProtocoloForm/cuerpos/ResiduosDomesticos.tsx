import React from "react";
import {
  ESTADOS_TIEMPO,
  EVACUACIONES_FINALES,
  TIPOS_INSTALACION,
} from "@/lib/constants/protocolo.constants";
import type { DatosResiduosDomesticos } from "@/schemas/muestreos/muestreos.schema";
import { ProtocoloSection } from "../ProtocoloSection";
import { ImagenUploader } from "../ImagenUploader";
import {
  CampoArea,
  CampoMedicion,
  CampoSelect,
  CampoSiNo,
  CampoTexto,
  SeparadorSeccion,
} from "../Campos";
import {
  PuntoMuestreoResiduos,
  TipoMuestreoSeleccionado,
} from "./ResiduosComun";
import {
  cambiarBloque,
  type CuerpoProtocolo,
  type PropsCuerpo,
} from "./tipos";

function Datos({ datos, setDatos, errores, desde, puntoId }: PropsCuerpo) {
  const d = datos as unknown as DatosResiduosDomesticos;
  const muestra = d.muestra_punto_muestreo;
  const inspeccion = d.inspeccion_sanitaria;

  const setMuestra = (campo: string, valor: unknown) =>
    cambiarBloque(setDatos, "muestra_punto_muestreo", campo, valor);
  const setInspeccion = (campo: string, valor: unknown) =>
    cambiarBloque(setDatos, "inspeccion_sanitaria", campo, valor);

  return (
    <>
      <ProtocoloSection
        numero={desde}
        titulo="Datos de la Muestra, Lugar y Punto de Muestreo"
      >
        <CampoSelect
          label="Tipo de instalación (alcantarillado)"
          value={muestra.tipo_instalacion}
          onChange={(v) => setMuestra("tipo_instalacion", v)}
          opciones={TIPOS_INSTALACION}
          error={errores["muestra_punto_muestreo.tipo_instalacion"]}
        />
        <CampoTexto
          label="Lugar de muestreo (detalle)"
          value={muestra.lugar_muestreo}
          onChange={(v) => setMuestra("lugar_muestreo", v)}
          error={errores["muestra_punto_muestreo.lugar_muestreo"]}
        />

        <CampoSiNo
          id="planta-tratamiento"
          label="¿Tiene planta de tratamiento?"
          value={muestra.planta_tratamiento}
          onChange={(v) => setMuestra("planta_tratamiento", v)}
        />
        {muestra.planta_tratamiento && (
          <CampoTexto
            label="Describa el (los) tratamiento(s)"
            value={muestra.descripcion_planta_tratamiento}
            onChange={(v) => setMuestra("descripcion_planta_tratamiento", v)}
          />
        )}

        <SeparadorSeccion />

        <PuntoMuestreoResiduos
          punto={muestra.punto_muestreo}
          setDatos={setDatos}
        />

        <CampoArea
          label="Punto de muestreo (detalle)"
          value={muestra.detalle_punto_muestreo}
          onChange={(v) => setMuestra("detalle_punto_muestreo", v)}
          rows={2}
        />

        <SeparadorSeccion />

        <TipoMuestreoSeleccionado
          seleccionado={muestra.tipo_muestreo_seleccionado}
          setDatos={setDatos}
        />

        <CampoTexto
          label="Apariencia de la muestra"
          value={muestra.apariencia_muestra}
          onChange={(v) => setMuestra("apariencia_muestra", v)}
        />
        <CampoSelect
          label="Estado del tiempo"
          value={muestra.estado_tiempo}
          onChange={(v) => setMuestra("estado_tiempo", v)}
          opciones={ESTADOS_TIEMPO}
        />

        <CampoSiNo
          id="preservado-rdl"
          label="Muestreo de acuerdo a normas del C.A.S.A."
          value={muestra.muestreo_simple_preservado_casa}
          onChange={(v) => setMuestra("muestreo_simple_preservado_casa", v)}
        />
      </ProtocoloSection>

      <ProtocoloSection numero={desde + 1} titulo="Inspección Sanitaria">
        <CampoArea
          label="Condiciones de la PTARD"
          value={inspeccion.condiciones_ptard}
          onChange={(v) => setInspeccion("condiciones_ptard", v)}
          rows={2}
        />
        <CampoArea
          label="Condiciones del lugar de muestreo"
          value={inspeccion.condiciones_lugar_muestreo}
          onChange={(v) => setInspeccion("condiciones_lugar_muestreo", v)}
          rows={2}
        />
        <CampoArea
          label="Condiciones del punto de muestreo"
          value={inspeccion.condiciones_punto_muestreo}
          onChange={(v) => setInspeccion("condiciones_punto_muestreo", v)}
          rows={2}
        />

        <ImagenUploader
          puntoId={puntoId}
          destino="protocolos"
          imagenes={inspeccion.imagenes}
          onChange={(imagenes) => setInspeccion("imagenes", imagenes)}
        />

        <SeparadorSeccion />

        <CampoSelect
          label="Evacuación final del ARD"
          value={inspeccion.evacuacion_final_ard}
          onChange={(v) => setInspeccion("evacuacion_final_ard", v)}
          opciones={EVACUACIONES_FINALES}
        />
        <CampoTexto
          label="Persona de referencia"
          value={inspeccion.persona_referencia}
          onChange={(v) => setInspeccion("persona_referencia", v)}
        />
      </ProtocoloSection>
    </>
  );
}

function Mediciones({ datos, setDatos, desde }: PropsCuerpo) {
  const mediciones = (datos as unknown as DatosResiduosDomesticos)
    .mediciones_campo;
  const set = (campo: string, valor: string) =>
    cambiarBloque(setDatos, "mediciones_campo", campo, valor);

  return (
    <ProtocoloSection numero={desde} titulo="Datos de Mediciones de Campo">
      <CampoMedicion
        label="pH"
        value={mediciones.ph}
        onChange={(v) => set("ph", v)}
      />
      <CampoMedicion
        label="Conductividad (uS/cm)"
        value={mediciones.conductividad_us_cm}
        onChange={(v) => set("conductividad_us_cm", v)}
      />
      <CampoMedicion
        label="Temperatura °C (Muestra)"
        value={mediciones.temperatura_muestra_c}
        onChange={(v) => set("temperatura_muestra_c", v)}
      />
      <CampoMedicion
        label="Temperatura °C (Ambiente)"
        value={mediciones.temperatura_ambiente_c}
        onChange={(v) => set("temperatura_ambiente_c", v)}
      />
      <CampoMedicion
        label="O.D. (mg O2/L)"
        value={mediciones.od_mg_l}
        onChange={(v) => set("od_mg_l", v)}
      />
      <CampoMedicion
        label="Caudal (L/s)"
        value={mediciones.caudal_l_s}
        onChange={(v) => set("caudal_l_s", v)}
      />
      <CampoMedicion
        label="Sólidos sedimentables (ml/L)"
        value={mediciones.solidos_sedimentales}
        onChange={(v) => set("solidos_sedimentales", v)}
      />

      <CampoArea
        label="Principales reactivos utilizados en el tratamiento"
        value={mediciones.productos_quimicos}
        onChange={(v) => set("productos_quimicos", v)}
        rows={2}
      />
    </ProtocoloSection>
  );
}

export const cuerpoResiduosDomesticos: CuerpoProtocolo = {
  Datos,
  Mediciones,
  seccionesDatos: 2,
};

