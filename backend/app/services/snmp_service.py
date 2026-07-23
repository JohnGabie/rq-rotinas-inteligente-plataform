"""
Serviço para controle de dispositivos SNMP
Baseado no seu protótipo funcional com régua de tomadas
"""
import subprocess
from typing import Optional, Dict, Any, List
from app.core.config import settings
from app.utils.logger import logger


class SNMPService:
    """Gerencia comandos SNMP para controle de tomadas/dispositivos"""

    def __init__(self):
        self.timeout = settings.SNMP_TIMEOUT
        self.retries = settings.SNMP_RETRIES

    def _build_oid(self, base_oid: str, porta: int) -> str:
        """
        Constrói OID baseado na porta
        Porta humana 1 → OID .9.0 (base + 8)

        Args:
            base_oid: OID base do dispositivo
            porta: Número da porta (1-10)

        Returns:
            str: OID completo
        """
        base = base_oid.rstrip('.')
        return f"{base}.{porta + 8}.0"

    def _common_args(self, community: str) -> List[str]:
        """
        Argumentos SNMP comuns a todos os comandos, garantindo que o timeout e o
        número de retries CONFIGURADOS (settings.SNMP_TIMEOUT / SNMP_RETRIES) sejam
        de fato aplicados — antes, ligar/desligar/get_status omitiam -t/-r e usavam
        os defaults do net-snmp, ignorando a configuração.
        """
        return [
            "-v2c",
            "-c", community,
            "-t", str(self.timeout),
            "-r", str(self.retries),
        ]

    def _run_command(self, cmd: list) -> Dict[str, Any]:
        """
        Executa comando SNMP e retorna resultado estruturado

        Args:
            cmd: Lista com comando snmpset/snmpget

        Returns:
            dict com success, stdout, stderr, returncode
        """
        # Teto de wall-clock para o subprocess: precisa ser MAIOR que o orçamento
        # interno do net-snmp (timeout por tentativa × (retries + 1)); caso
        # contrário o subprocess mataria o snmpget/snmpset no meio das retries.
        # O +2 é margem para o overhead de processo.
        subprocess_timeout = self.timeout * (self.retries + 1) + 2

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=subprocess_timeout
            )

            success = result.returncode == 0

            return {
                "success": success,
                "stdout": result.stdout.strip(),
                "stderr": result.stderr.strip(),
                "returncode": result.returncode
            }

        except subprocess.TimeoutExpired:
            logger.error(f"Timeout ao executar comando SNMP: {' '.join(cmd)}")
            return {
                "success": False,
                "stdout": "",
                "stderr": "Timeout na operação SNMP",
                "returncode": -1
            }
        except Exception as e:
            logger.error(f"Erro ao executar SNMP: {e}")
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "returncode": -1
            }

    def ligar(self, ip: str, porta: int, community: str, base_oid: str) -> bool:
        """
        Liga uma tomada SNMP

        Args:
            ip: IP do dispositivo SNMP
            porta: Número da porta (1-10)
            community: Community string de escrita
            base_oid: OID base do dispositivo

        Returns:
            bool: True se sucesso
        """
        if not (1 <= porta <= 10):
            logger.error(f"Porta inválida: {porta}")
            return False

        oid = self._build_oid(base_oid, porta)

        cmd = [
            "snmpset",
            *self._common_args(community),
            ip,
            oid,
            "i", "1"  # integer value 1 = ON
        ]

        result = self._run_command(cmd)

        if result["success"]:
            logger.info(f"SNMP {ip}:{porta} ligado com sucesso")
        else:
            logger.error(f"Erro ao ligar SNMP {ip}:{porta}: {result['stderr']}")

        return result["success"]

    def desligar(self, ip: str, porta: int, community: str, base_oid: str) -> bool:
        """
        Desliga uma tomada SNMP

        Args:
            ip: IP do dispositivo SNMP
            porta: Número da porta (1-10)
            community: Community string de escrita
            base_oid: OID base do dispositivo

        Returns:
            bool: True se sucesso
        """
        if not (1 <= porta <= 10):
            logger.error(f"Porta inválida: {porta}")
            return False

        oid = self._build_oid(base_oid, porta)

        cmd = [
            "snmpset",
            *self._common_args(community),
            ip,
            oid,
            "i", "0"  # integer value 0 = OFF
        ]

        result = self._run_command(cmd)

        if result["success"]:
            logger.info(f"SNMP {ip}:{porta} desligado com sucesso")
        else:
            logger.error(f"Erro ao desligar SNMP {ip}:{porta}: {result['stderr']}")

        return result["success"]

    def get_status(self, ip: str, porta: int, community: str, base_oid: str) -> Optional[bool]:
        """
        Obtém status de uma tomada SNMP

        Args:
            ip: IP do dispositivo SNMP
            porta: Número da porta (1-10)
            community: Community string de leitura
            base_oid: OID base do dispositivo

        Returns:
            bool: True se ligado, False se desligado, None se erro
        """
        if not (1 <= porta <= 10):
            logger.error(f"Porta inválida: {porta}")
            return None

        oid = self._build_oid(base_oid, porta)

        cmd = [
            "snmpget",
            *self._common_args(community),
            ip,
            oid
        ]

        result = self._run_command(cmd)

        if not result["success"]:
            logger.error(f"Erro ao obter status SNMP {ip}:{porta}: {result['stderr']}")
            return None

        # Parse do stdout para extrair valor
        # Formato típico: "SNMPv2-SMI::enterprises... = INTEGER: 1"
        try:
            stdout = result["stdout"]
            if "INTEGER:" in stdout:
                value = stdout.split("INTEGER:")[1].strip()
                is_on = value == "1"
                logger.debug(f"Status SNMP {ip}:{porta}: {'ON' if is_on else 'OFF'}")
                return is_on
            else:
                logger.warning(f"Formato inesperado no status SNMP: {stdout}")
                return None

        except Exception as e:
            logger.error(f"Erro ao parsear status SNMP: {e}")
            return None

    def check_connection(self, ip: str, community: str = "public") -> bool:
        """
        Verifica se o dispositivo SNMP está acessível

        Args:
            ip: IP do dispositivo
            community: Community string

        Returns:
            bool: True se acessível
        """
        cmd = [
            "snmpget",
            *self._common_args(community),
            ip,
            "1.3.6.1.2.1.1.1.0"  # sysDescr.0 (OID universal)
        ]

        result = self._run_command(cmd)

        if result["success"]:
            logger.debug(f"SNMP {ip} acessível")
        else:
            logger.warning(f"SNMP {ip} não acessível: {result['stderr']}")

        return result["success"]


# Instância global (singleton)
snmp_service = SNMPService()